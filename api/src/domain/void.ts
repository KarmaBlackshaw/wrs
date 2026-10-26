import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TPaymentMethod } from "@wrs/contract/payment";
import type { TPaymentType } from "@wrs/contract/sale";
import type { TVoid, TVoidBody, TVoidRefType } from "@wrs/contract/void";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { recordDeposit } from "./deposit.ts";
import { requireValueAt } from "./setting.ts";
import { addStockEntry } from "./stock.ts";

type TDb = TCtx["db"];

type TVoidRow = Omit<TVoid, "refund">;

type TTarget = {
  amount: number;
  paymentType: TPaymentType;
  drawerSessionId: string | null;
  tripReceivedSessionId: string | null;
  isTripBack: boolean;
  voidedAt: Date | null;
};

type TRequestVoidInput = Omit<TVoidBody, "refType"> & { refType: TVoidRefType; bypassThreshold?: boolean };

const TABLE = { delivery: "deliveries", walk_in_sale: "walkInSales", payment: "payments" } as const;

const SUMMARY_SQL = `case v.ref_type
  when 'delivery' then (
    select concat(${fullNameSql("c")}, ' · ', group_concat(concat(l.qty, '× ', p.name) order by p.name separator ', '))
    from deliveries d join customers c on c.id = d.customer_id join delivery_lines l on l.delivery_id = d.id join products p on p.id = l.product_id
    where d.id = v.ref_id group by d.id
  )
  when 'walk_in_sale' then (
    select concat(coalesce(${fullNameSql("c")}, 'Walk-in'), ' · ', group_concat(concat(l.qty, '× ', p.name) order by p.name separator ', '))
    from walk_in_sales w left join customers c on c.id = w.customer_id join walk_in_sale_lines l on l.sale_id = w.id join products p on p.id = l.product_id
    where w.id = v.ref_id group by w.id
  )
  when 'payment' then (
    select concat(${fullNameSql("c")}, ' · payment') from payments y join customers c on c.id = y.customer_id where y.id = v.ref_id
  )
end`;

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Void not found." });

const alreadyVoided = () => domainError({ statusCode: 409, code: "void.already_voided", message: "This record is already voided or has a pending void." });

export const voidQuery = (db: TDb) =>
  db("voids as v")
    .join("employees as rb", "rb.id", "v.requestedBy")
    .leftJoin("employees as ab", "ab.id", "v.approvedBy")
    .select(
      "v.id",
      "v.refType",
      "v.refId",
      "v.amount",
      db.raw(`coalesce(${SUMMARY_SQL}, '') as summary`),
      "v.reason",
      "v.requestedBy as requestedById",
      db.raw(`${fullNameSql("rb")} as requested_by_name`),
      "v.status",
      "v.approvedBy as approvedById",
      db.raw(`${fullNameSql("ab")} as approved_by_name`),
      "v.decidedAt",
      "v.decisionReason",
      "v.createdAt",
      "v.updatedAt"
    );

export const withVoidRefunds = async (db: TDb, rows: TVoidRow[]): Promise<TVoid[]> => {
  const refunds: TVoid["refund"][] = await db("voidRefunds as r")
    .join("employees as e", "e.id", "r.createdBy")
    .whereIn(
      "r.voidId",
      rows.map(({ id }) => id)
    )
    .select(
      "r.id",
      "r.voidId",
      "r.amount",
      "r.method",
      "r.drawerSessionId",
      "r.createdBy",
      db.raw(`${fullNameSql("e")} as created_by_name`),
      "r.createdAt",
      "r.updatedAt"
    );

  return rows.map((row) => ({ ...row, refund: refunds.find((refund) => refund?.voidId === row.id) ?? null }));
};

const getVoid = async (db: TDb, id: string) => {
  const rows: TVoidRow[] = await voidQuery(db).where("v.id", id);
  const [found] = await withVoidRefunds(db, rows);

  if (!found) {
    throw notFound();
  }

  return found;
};

const lockTarget = async (ctx: TCtx, refType: TVoidRefType, refId: string): Promise<TTarget> => {
  const { db } = ctx;
  const isWalkIn = refType === "walk_in_sale";
  const record = db(`${TABLE[refType]} as x`).where("x.id", refId).forUpdate();

  const target: TTarget | undefined = await (isWalkIn ? record : record.leftJoin("trips as t", "t.id", "x.tripId")).first(
    "x.amount",
    refType === "payment" ? "x.method as paymentType" : "x.paymentType",
    refType === "delivery" ? db.raw("null as drawer_session_id") : "x.drawerSessionId",
    isWalkIn ? db.raw("null as trip_received_session_id") : "t.receivedDrawerSessionId as tripReceivedSessionId",
    db.raw(isWalkIn ? "false as is_trip_back" : "coalesce(t.status in ('returned', 'reconciled'), false) as is_trip_back"),
    "x.voidedAt"
  );

  if (!target) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "The record to void doesn't exist.", details: { field: "refId" } });
  }

  if (target.voidedAt != null) {
    throw alreadyVoided();
  }

  return target;
};

const isOpenSession = async (ctx: TCtx, id: string) => {
  const session: { closedAt: Date | null } | undefined = await ctx.db("drawerSessions").where({ id }).forUpdate().first("closedAt");

  return session?.closedAt === null;
};

const currentDrawer = async (ctx: TCtx, requestedBy: string) => {
  const open: { id: string } | undefined = await ctx
    .db("drawerSessions")
    .whereNull("closedAt")
    .orderByRaw("cashier_id = ? desc", [requestedBy])
    .orderBy("openedAt", "desc")
    .forUpdate()
    .first("id");

  return open?.id ?? null;
};

const refundSession = async (ctx: TCtx, { method, sessionId, requestedBy }: { method: TPaymentMethod; sessionId: string | null; requestedBy: string }) => {
  if (method !== "cash") {
    return null;
  }

  if (sessionId != null && (await isOpenSession(ctx, sessionId))) {
    return sessionId;
  }

  return currentDrawer(ctx, requestedBy);
};

const reverseContainers = async (
  ctx: TCtx,
  { refType, refId, voidId, isTripBack }: { refType: TVoidRefType; refId: string; voidId: string; isTripBack: boolean }
) => {
  const movements: {
    type: string;
    containerType: string;
    qty: number;
    full: boolean;
    fromLocation: string;
    toLocation: string;
    riderId: string | null;
    customerId: string | null;
  }[] = await ctx
    .db("containerMovements")
    .where({ refType, refId })
    .whereNot({ type: "filled" })
    .orderBy("createdAt")
    .select("type", "containerType", "qty", "full", "fromLocation", "toLocation", "riderId", "customerId");

  const reversedSide = (location: string) => (isTripBack && location === "rider" ? "station" : location);

  for (const { fromLocation, toLocation, riderId, ...movement } of movements) {
    await insertRecord(ctx, "containerMovements", {
      ...movement,
      fromLocation: reversedSide(toLocation),
      toLocation: reversedSide(fromLocation),
      riderId: isTripBack ? null : riderId,
      reason: null,
      refType: "void",
      refId: voidId,
      createdBy: ctx.actor.id,
    });
  }
};

const reverseStock = async (ctx: TCtx, { refType, refId, voidId }: { refType: TVoidRefType; refId: string; voidId: string }) => {
  const entries: { consumableId: string; qty: number }[] = await ctx.db("stockEntries").where({ refType, refId }).select("consumableId", "qty");

  for (const { consumableId, qty } of entries) {
    await addStockEntry(ctx, { consumableId, kind: "void", qty: -qty, refType: "void", refId: voidId });
  }
};

const reverseDeposits = async (
  ctx: TCtx,
  { refType, refId, voidId, target, requestedBy }: { refType: TVoidRefType; refId: string; voidId: string; target: TTarget; requestedBy: string }
) => {
  const entries: {
    customerId: string;
    containerType: TContainerTypeCode;
    qty: number;
    amount: number;
    method: TPaymentMethod | null;
    tripId: string | null;
    drawerSessionId: string | null;
  }[] = await ctx
    .db("depositEntries")
    .where({ refType, refId, kind: "collected" })
    .select("customerId", "containerType", "qty", "amount", "method", "tripId", "drawerSessionId");

  for (const { customerId, containerType, qty, amount, method, tripId, drawerSessionId } of entries) {
    const isOnUnreceivedTrip = tripId != null && target.tripReceivedSessionId == null;
    const sessionId = method == null || isOnUnreceivedTrip ? null : await refundSession(ctx, { method, sessionId: drawerSessionId, requestedBy });

    await recordDeposit(ctx, {
      customerId,
      kind: "refunded",
      method: method ?? undefined,
      tripId: isOnUnreceivedTrip ? tripId : undefined,
      drawerSessionId: sessionId ?? undefined,
      refType: "void",
      refId: voidId,
      lines: [{ containerType, qty, amount }],
    });
  }
};

const refundCash = async (ctx: TCtx, { voidId, target, requestedBy }: { voidId: string; target: TTarget; requestedBy: string }) => {
  const { amount, paymentType, drawerSessionId, tripReceivedSessionId } = target;

  if (paymentType === "credit" || amount === 0) {
    return;
  }

  const landedSessionId = drawerSessionId ?? tripReceivedSessionId;

  if (landedSessionId == null) {
    return;
  }

  const dropsOutOfDrawer = drawerSessionId != null && (await isOpenSession(ctx, drawerSessionId));

  if (dropsOutOfDrawer) {
    return;
  }

  const sessionId = paymentType === "cash" ? await currentDrawer(ctx, requestedBy) : null;

  await insertRecord(ctx, "voidRefunds", { voidId, amount, method: paymentType, drawerSessionId: sessionId, createdBy: ctx.actor.id });
};

const reverse = async (
  ctx: TCtx,
  { voidId, refType, refId, target, requestedBy }: { voidId: string; refType: TVoidRefType; refId: string; target: TTarget; requestedBy: string }
) => {
  await ctx.db(TABLE[refType]).where({ id: refId }).update({ voidedAt: ctx.now });

  const ref = { refType, refId, voidId };

  await reverseContainers(ctx, { ...ref, isTripBack: target.isTripBack });
  await reverseStock(ctx, ref);
  await reverseDeposits(ctx, { ...ref, target, requestedBy });
  await refundCash(ctx, { voidId, target, requestedBy });
};

export const requestVoid = async (ctx: TCtx, { refType, refId, reason, bypassThreshold = false }: TRequestVoidInput): Promise<TVoid> => {
  const target = await lockTarget(ctx, refType, refId);
  const pending = await ctx.db("voids").where({ refType, refId, status: "pending" }).first("id");

  if (pending) {
    throw alreadyVoided();
  }

  const threshold = await requireValueAt(ctx, "void.approvalThreshold", ctx.now);
  const isApplied = bypassThreshold || target.amount < threshold;

  const voidId = await insertRecord(ctx, "voids", {
    refType,
    refId,
    reason,
    amount: target.amount,
    requestedBy: ctx.actor.id,
    status: isApplied ? "approved" : "pending",
    approvedBy: isApplied ? ctx.actor.id : null,
    decidedAt: isApplied ? ctx.now : null,
  });

  if (isApplied) {
    await reverse(ctx, { voidId, refType, refId, target, requestedBy: ctx.actor.id });
  }

  return getVoid(ctx.db, voidId);
};

const lockPending = async (ctx: TCtx, id: string) => {
  const row: { refType: TVoidRefType; refId: string; status: string; requestedBy: string } | undefined = await ctx
    .db("voids")
    .where({ id })
    .forUpdate()
    .first("refType", "refId", "status", "requestedBy");

  if (!row) {
    throw notFound();
  }

  if (row.status !== "pending") {
    throw domainError({ statusCode: 409, code: "approval.not_pending", message: "This request has already been decided.", details: { status: row.status } });
  }

  return row;
};

export const applyVoid = async (ctx: TCtx, { voidId }: { voidId: string }): Promise<TVoid> => {
  const { refType, refId, requestedBy } = await lockPending(ctx, voidId);
  const target = await lockTarget(ctx, refType, refId);

  await ctx.db("voids").where({ id: voidId }).update({ status: "approved", approvedBy: ctx.actor.id, decidedAt: ctx.now });
  await reverse(ctx, { voidId, refType, refId, target, requestedBy });

  return getVoid(ctx.db, voidId);
};

export const rejectVoid = async (ctx: TCtx, voidId: string, { reason }: { reason: string }): Promise<TVoid> => {
  await lockPending(ctx, voidId);
  await ctx.db("voids").where({ id: voidId }).update({ status: "rejected", approvedBy: ctx.actor.id, decidedAt: ctx.now, decisionReason: reason });

  return getVoid(ctx.db, voidId);
};
