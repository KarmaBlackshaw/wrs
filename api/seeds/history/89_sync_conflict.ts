import type { TSyncOp } from "@wrs/contract/sync";
import { depositDue, getCustomer } from "../../src/domain/customer.ts";
import { priceAt } from "../../src/domain/product.ts";
import { acceptSyncConflict } from "../../src/domain/sync-conflict.ts";
import { applyOp } from "../../src/domain/sync-ops.ts";
import type { TCtx } from "../../src/lib/context/makeCtx.ts";
import { ID_GROUP, PRODUCT } from "../ids/index.ts";
import { SEED_ACTOR, nextId, type THistoryHook } from "../ids/history.ts";

const rider = SEED_ACTOR.rider1;

const pushConflict = async (ctx: TCtx, op: TSyncOp) => {
  const result = await applyOp({ db: ctx.db, actor: rider, op, serverNow: ctx.now });

  if (result.conflictId == null) {
    throw new Error(`${op.kind} was applied without a conflict`);
  }

  return result.conflictId;
};

const overLimitDelivery = async (ctx: TCtx, { tripId, customerId }: { tripId: string; customerId: string }) => {
  const customer = await getCustomer(ctx, customerId);
  const unitPrice = (await priceAt(ctx, { productId: PRODUCT.roundRefill, at: ctx.now })) ?? 0;
  const qty = customer.creditEnabled ? Math.max(1, Math.floor(((customer.creditLimit ?? 0) - customer.creditBalance) / unitPrice) + 1) : 2;
  const emptiesCollected = Math.min(customer.heldByType.round ?? 0, qty);
  const borrowed = qty - emptiesCollected;
  const due = borrowed > 0 ? await depositDue(ctx, { customerId, borrowed: [{ containerType: "round", qty: borrowed }] }) : 0;

  return pushConflict(ctx, {
    opId: nextId(ID_GROUP.clientOp),
    occurredAt: ctx.now.toISOString(),
    kind: "delivery.create",
    payload: {
      id: nextId(ID_GROUP.delivery),
      tripId,
      customerId,
      lines: [{ productId: PRODUCT.roundRefill, qty, emptiesCollected, unitPrice }],
      paymentType: "credit",
      deposit: due > 0 ? { method: "cash", lines: [{ containerType: "round", qty: borrowed, amount: due }] } : undefined,
    },
  });
};

const overBalancePayment = async (ctx: TCtx, { tripId, customerId }: { tripId: string; customerId: string }) => {
  const { creditBalance } = await getCustomer(ctx, customerId);

  return pushConflict(ctx, {
    opId: nextId(ID_GROUP.clientOp),
    occurredAt: ctx.now.toISOString(),
    kind: "payment.create",
    payload: { id: nextId(ID_GROUP.payment), customerId, amount: creditBalance + 10000, method: "cash", tripId },
  });
};

export const hook: THistoryHook = {
  async after({ db, today, ctxFor }) {
    const at = (time: string) => new Date(`${today}T${time}:00+08:00`);
    const trip: { id: string } | undefined = await db("trips").where({ riderId: rider.id, status: "open" }).first("id");

    if (!trip) {
      throw new Error("The sync conflict seed needs rider1's open trip today");
    }

    const customers: string[] = await db("customers as c")
      .leftJoin("deliveries as d", (join) => join.on("d.customerId", "c.id").andOnVal("d.tripId", trip.id))
      .where((query) => query.where("c.riderId", rider.id).orWhereNull("c.riderId"))
      .where("c.status", "active")
      .orderByRaw("d.id is not null, c.credit_enabled desc, c.id")
      .pluck("c.id");

    const [undelivered, other] = customers;

    if (!undelivered || !other) {
      throw new Error("The sync conflict seed needs two of rider1's customers");
    }

    const conflictId = await overBalancePayment(ctxFor(rider, at("11:00"), "record"), { tripId: trip.id, customerId: other });

    await acceptSyncConflict(ctxFor(SEED_ACTOR.owner, at("11:30")), conflictId);
    await overLimitDelivery(ctxFor(rider, at("13:00"), "record"), { tripId: trip.id, customerId: undelivered });
  },
};
