import { errorCodeSchema } from "@wrs/contract/common";
import { syncConflictStatusSchema, syncOpKindSchema, type TSyncConflict } from "@wrs/contract/sync";
import type { TVoidRefType } from "@wrs/contract/void";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { applyVoid, requestVoid } from "./void.ts";

type TDb = TCtx["db"];

export type TConflictRow = Omit<TSyncConflict, "opKind" | "codes" | "status" | "canVoid"> & { opKind: string; codes: unknown; status: string };

type TVoidTarget = { refType: TVoidRefType; refId: string };

type TLockedConflict = { clientOpId: string; refType: string | null; refId: string | null; codes: unknown; status: string };

const isAliasConflict = ({ refType, codes }: { refType: string | null; codes: TSyncConflict["codes"] }) =>
  refType === "customer" && codes.includes("customer.duplicate_phone");

const isVoidable = ({ refType, refId, codes }: Pick<TSyncConflict, "refType" | "refId" | "codes">) =>
  refId == null || refType === "delivery" || refType === "payment" || isAliasConflict({ refType, codes });

const payloadSql = (path: string) => `json_unquote(json_extract(s.payload, '$.${path}'))`;

const CUSTOMER_ID_SQL = `coalesce(
  (select d.customer_id from deliveries d where s.ref_type = 'delivery' and d.id = s.ref_id),
  (select y.customer_id from payments y where s.ref_type = 'payment' and y.id = s.ref_id),
  if(s.ref_type = 'customer', s.ref_id, null),
  (select o.ref_id from client_ops o where o.kind = 'customer.create' and o.id = ${payloadSql("payload.customerId")}),
  ${payloadSql("payload.customerId")}
)`;

const SUMMARY_SQL = `concat_ws(' · ',
  coalesce(
    (select ${fullNameSql("c")} from customers c where c.id = ${CUSTOMER_ID_SQL}),
    nullif(concat_ws(' ', ${payloadSql("payload.firstName")}, ${payloadSql("payload.lastName")}), '')
  ),
  case s.op_kind
    when 'delivery.create' then (
      select group_concat(concat(l.qty, '× ', p.name) order by p.name separator ', ')
      from delivery_lines l join products p on p.id = l.product_id where l.delivery_id = s.ref_id
    )
    when 'payment.create' then 'payment'
    when 'customer.create' then ${payloadSql("payload.phone")}
    when 'customer.release' then 'release'
    when 'waiver_request.create' then 'deposit waiver'
    when 'trip.end' then 'trip end'
  end
)`;

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Sync conflict not found." });

export const toSyncConflict = ({ opKind, codes, status, ...row }: TConflictRow): TSyncConflict => {
  const parsedCodes = errorCodeSchema.array().parse(codes);

  return {
    ...row,
    opKind: syncOpKindSchema.parse(opKind),
    codes: parsedCodes,
    status: syncConflictStatusSchema.parse(status),
    canVoid: isVoidable({ ...row, codes: parsedCodes }),
  };
};

export const syncConflictQuery = (db: TDb) =>
  db("syncConflicts as s")
    .join("employees as e", "e.id", "s.employeeId")
    .select(
      "s.id as conflictId",
      "s.opKind",
      "s.codes",
      db.raw(`${fullNameSql("e")} as rider_name`),
      db.raw(`${payloadSql("occurredAt")} as occurred_at`),
      db.raw(`coalesce(${SUMMARY_SQL}, '') as summary`),
      "s.refType",
      "s.refId",
      "s.status"
    );

const getSyncConflict = async (db: TDb, id: string) => {
  const row: TConflictRow | undefined = await syncConflictQuery(db).where("s.id", id).first();

  if (!row) {
    throw notFound();
  }

  return toSyncConflict(row);
};

const lockPending = async (ctx: TCtx, id: string) => {
  const row: TLockedConflict | undefined = await ctx.db("syncConflicts").where({ id }).forUpdate().first("clientOpId", "refType", "refId", "codes", "status");

  if (!row) {
    throw notFound();
  }

  if (row.status !== "pending") {
    throw domainError({ statusCode: 409, code: "approval.not_pending", message: "This conflict has already been handled.", details: { status: row.status } });
  }

  return row;
};

const aliasedRecords = async (ctx: TCtx, aliasId: string) => {
  const recordsOf = async (refType: "delivery" | "payment") => {
    const ids: string[] = await ctx
      .db(`${refType === "delivery" ? "deliveries" : "payments"} as x`)
      .join("clientOps as o", "o.refId", "x.id")
      .where({ "o.customerId": aliasId, "o.refType": refType })
      .orderBy("o.createdAt")
      .pluck("x.id");

    return ids.map((id) => ({ refType, refId: id }));
  };

  return [...(await recordsOf("delivery")), ...(await recordsOf("payment"))];
};

const voidTargets = async (ctx: TCtx, conflict: TLockedConflict): Promise<TVoidTarget[]> => {
  const { refType, refId, clientOpId } = conflict;
  const codes = errorCodeSchema.array().parse(conflict.codes);

  if (!isVoidable({ refType, refId, codes })) {
    throw domainError({ statusCode: 409, code: "conflict", message: "This conflict has nothing to void. Accept it instead.", details: { refType } });
  }

  if (refId == null) {
    return [];
  }

  if (refType === "delivery" || refType === "payment") {
    return [{ refType, refId }];
  }

  return aliasedRecords(ctx, clientOpId);
};

const voidRecord = async (ctx: TCtx, { refType, refId, reason }: TVoidTarget & { reason: string }) => {
  const record: { voidedAt: Date | null } | undefined = await ctx
    .db(refType === "delivery" ? "deliveries" : "payments")
    .where({ id: refId })
    .forUpdate()
    .first("voidedAt");

  if (record?.voidedAt != null) {
    return;
  }

  const pending: { id: string } | undefined = await ctx.db("voids").where({ refType, refId, status: "pending" }).forUpdate().first("id");

  if (pending) {
    await applyVoid(ctx, { voidId: pending.id });

    return;
  }

  await requestVoid(ctx, { refType, refId, reason, bypassThreshold: true });
};

export const acceptSyncConflict = async (ctx: TCtx, id: string) => {
  const { refId } = await lockPending(ctx, id);

  if (refId == null) {
    throw domainError({ statusCode: 409, code: "conflict", message: "Nothing was recorded for this conflict. It can only be voided." });
  }

  await ctx.db("syncConflicts").where({ id }).update({ status: "accepted", decidedBy: ctx.actor.id, decidedAt: ctx.now });

  return getSyncConflict(ctx.db, id);
};

export const voidSyncConflict = async (ctx: TCtx, id: string, { reason }: { reason: string }) => {
  const conflict = await lockPending(ctx, id);
  const targets = await voidTargets(ctx, conflict);

  for (const target of targets) {
    await voidRecord(ctx, { ...target, reason });
  }

  const decision = { status: "voided", decidedBy: ctx.actor.id, decidedAt: ctx.now, decisionReason: reason };

  await ctx
    .db("syncConflicts")
    .where({ id })
    .orWhere((query) =>
      query.where({ status: "pending" }).whereIn(
        "refId",
        targets.map((target) => target.refId)
      )
    )
    .update(decision);

  return getSyncConflict(ctx.db, id);
};
