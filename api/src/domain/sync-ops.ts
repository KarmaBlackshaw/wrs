import { errorCodeSchema, type TErrorCode } from "@wrs/contract/common";
import type { TSyncOp, TSyncPushResult } from "@wrs/contract/sync";
import type { Knex } from "knex";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { makeCtx, type TActor, type TCtx } from "../lib/context/makeCtx.ts";
import { DomainError, domainError } from "../lib/errors/domainError.ts";
import { createCustomer } from "./customer.ts";
import { releaseCustomer } from "./customer-assignment.ts";
import { recordDelivery } from "./delivery.ts";
import { recordPayment } from "./payment.ts";
import { endTrip } from "./trip.ts";
import { requestWaiver } from "./waiver.ts";

type TOpResult = TSyncPushResult["results"][number];

type TRef = { refType: string; refId: string };

type TApplyOpOptions = { db: Knex; actor: TActor; op: TSyncOp; serverNow: Date };

const dbErrorCode = (error: unknown) => (error instanceof Error && "code" in error ? error.code : undefined);

const isOpTaken = (error: unknown) => dbErrorCode(error) === "ER_DUP_ENTRY" && error instanceof Error && error.message.includes("client_ops.PRIMARY");

const hardInvariantCode = (error: unknown): TErrorCode | undefined => {
  if (error instanceof DomainError) {
    return error.body.code;
  }

  const code = dbErrorCode(error);

  if (code === "ER_NO_REFERENCED_ROW_2") {
    return "reference.not_found";
  }

  return code === "ER_DUP_ENTRY" ? "conflict" : undefined;
};

const businessNow = async ({ db, actor, op, serverNow }: TApplyOpOptions) => {
  const query = db("trips").first("loadedAt");

  if ("tripId" in op.payload) {
    query.where({ id: op.payload.tripId });
  } else {
    query.where({ riderId: actor.id }).orderBy("loadedAt", "desc");
  }

  const trip: { loadedAt: string } | undefined = await query;
  const occurredAt = Math.max(Date.parse(op.occurredAt), trip ? Date.parse(trip.loadedAt) : -Infinity);

  return new Date(Math.min(occurredAt, serverNow.getTime()));
};

export const resolveCustomerId = async (ctx: TCtx, id: string) => {
  const created: { refId: string | null } | undefined = await ctx.db("clientOps").where({ id, kind: "customer.create" }).first("refId");

  return created?.refId ?? id;
};

const assertHeldAtOccurredAt = async (ctx: TCtx, customerId: string) => {
  const customer: { riderId: string | null } | undefined = await ctx.db("customers").where({ id: customerId }).forUpdate().first("riderId");

  if (!customer) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Customer not found.", details: { field: "customerId" } });
  }

  if (customer.riderId === ctx.actor.id) {
    return;
  }

  const held: { riderId: string | null } | undefined = await ctx
    .db("customerOwnerships")
    .where({ customerId })
    .where("createdAt", "<=", ctx.now)
    .orderBy([
      { column: "createdAt", order: "desc" },
      { column: "id", order: "desc" },
    ])
    .first("riderId");

  if (held?.riderId !== ctx.actor.id) {
    throw domainError({ statusCode: 403, code: "customer.not_owner", message: "This customer wasn't yours when you released it.", details: { customerId } });
  }
};

const dispatch = async (ctx: TCtx, op: TSyncOp, serverNow: Date): Promise<TRef> => {
  switch (op.kind) {
    case "customer.create": {
      const { customer } = await createCustomer(ctx, op.payload);

      return { refType: "customer", refId: customer.id };
    }
    case "customer.release": {
      const customerId = await resolveCustomerId(ctx, op.payload.customerId);

      await assertHeldAtOccurredAt(ctx, customerId);
      await releaseCustomer(ctx, { ...op.payload, customerId, appliedAt: serverNow });

      return { refType: "customer", refId: customerId };
    }
    case "delivery.create": {
      const customerId = await resolveCustomerId(ctx, op.payload.customerId);
      const delivery = await recordDelivery(ctx, { ...op.payload, customerId });

      return { refType: "delivery", refId: delivery.id };
    }
    case "payment.create": {
      const customerId = await resolveCustomerId(ctx, op.payload.customerId);
      const payment = await recordPayment(ctx, { ...op.payload, customerId });

      return { refType: "payment", refId: payment.id };
    }
    case "waiver_request.create": {
      const customerId = await resolveCustomerId(ctx, op.payload.customerId);
      const request = await requestWaiver(ctx, { ...op.payload, customerId });

      return { refType: "waiver_request", refId: request.id };
    }
    case "trip.end": {
      await endTrip(ctx, op.payload);

      return { refType: "trip", refId: op.payload.tripId };
    }
  }
};

const sentCustomerId = (op: TSyncOp) => {
  if (op.kind === "customer.create") {
    return op.payload.id;
  }

  return "customerId" in op.payload ? op.payload.customerId : null;
};

const claimOp = (ctx: TCtx, op: TSyncOp, status: TOpResult["status"]) =>
  insertRecord(ctx, "clientOps", { id: op.opId, employeeId: ctx.actor.id, kind: op.kind, status, customerId: sentCustomerId(op) });

const writeConflict = async (ctx: TCtx, { op, codes, ref }: { op: TSyncOp; codes: TErrorCode[]; ref?: TRef }): Promise<TOpResult> => {
  const conflictId = await insertRecord(ctx, "syncConflicts", {
    clientOpId: op.opId,
    employeeId: ctx.actor.id,
    opKind: op.kind,
    codes: JSON.stringify(codes),
    payload: JSON.stringify(op),
    refType: ref?.refType ?? null,
    refId: ref?.refId ?? null,
  });

  return { opId: op.opId, status: "conflict", conflictId, codes };
};

const storedOutcome = async (db: Knex, opId: string): Promise<TOpResult> => {
  const stored: { status: TOpResult["status"]; conflictId: string | null; codes: unknown } = await db("clientOps as o")
    .leftJoin("syncConflicts as s", "s.clientOpId", "o.id")
    .where("o.id", opId)
    .first("o.status", "s.id as conflictId", "s.codes");

  const { status, conflictId } = stored;

  return conflictId == null ? { opId, status } : { opId, status, conflictId, codes: errorCodeSchema.array().parse(stored.codes) };
};

export const applyOp = async (options: TApplyOpOptions): Promise<TOpResult> => {
  const { db, actor, op, serverNow } = options;
  const now = await businessNow(options);

  const inOpTx = async (fn: (ctx: TCtx) => Promise<TOpResult>) => {
    try {
      return await db.transaction((trx) => fn(makeCtx({ db: trx, actor, now, mode: "record" })));
    } catch (error) {
      if (isOpTaken(error)) {
        return storedOutcome(db, op.opId);
      }

      throw error;
    }
  };

  try {
    return await inOpTx(async (ctx) => {
      await claimOp(ctx, op, "applied");

      const ref = await dispatch(ctx, op, serverNow);
      const codes = [...new Set(ctx.violations.map(({ code }) => code))];

      await ctx
        .db("clientOps")
        .where({ id: op.opId })
        .update({ ...ref, status: codes.length > 0 ? "conflict" : "applied" });

      return codes.length > 0 ? writeConflict(ctx, { op, codes, ref }) : { opId: op.opId, status: "applied" };
    });
  } catch (error) {
    const code = hardInvariantCode(error);

    if (code == null) {
      throw error;
    }

    return inOpTx(async (ctx) => {
      await claimOp(ctx, op, "conflict");

      return writeConflict(ctx, { op, codes: [code] });
    });
  }
};
