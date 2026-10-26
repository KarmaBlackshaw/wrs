import type { TPaymentType } from "@wrs/contract/sale";
import type { TSyncOp } from "@wrs/contract/sync";
import type { TTripStatus } from "@wrs/contract/trip";
import { creditBlock } from "@wrs/contract/rules/creditBlock";
import { depositDue, getCustomer } from "../../src/domain/customer.ts";
import { priceAt } from "../../src/domain/product.ts";
import { applyOp } from "../../src/domain/sync-ops.ts";
import { getTripDetail, loadOutTrip, receiveTrip, reconcileTrip } from "../../src/domain/trip.ts";
import type { TActor } from "../../src/lib/context/makeCtx.ts";
import { ID_GROUP, PRODUCT } from "../ids/index.ts";
import { SEED_ACTOR, between, clock, nextId, pick, type THistoryHook, type TSeedDay } from "../ids/history.ts";

const TODAY_STATUSES: TTripStatus[] = ["open", "returning", "returned"];
const SUNDAY = 0;

const sync = async (day: TSeedDay, actor: TActor, op: TSyncOp) => {
  const result = await applyOp({ db: day.db, actor, op, serverNow: new Date(op.occurredAt) });

  if (result.status !== "applied") {
    throw new Error(`${op.kind} on ${day.date} was not applied: ${result.codes?.join(", ")}`);
  }
};

const deliver = async (day: TSeedDay, { rider, tripId, customerId, time }: { rider: TActor; tripId: string; customerId: string; time: string }) => {
  const { rand } = day;
  const ctx = day.ctxFor(rider, time);
  const customer = await getCustomer(ctx, customerId);
  const qty = between(rand, 1, 3);
  const unitPrice = (await priceAt(ctx, { productId: PRODUCT.roundRefill, at: ctx.now })) ?? 0;
  const amount = qty * unitPrice;
  const emptiesCollected = Math.min(customer.heldByType.round ?? 0, qty);
  const borrowed = qty - emptiesCollected;
  const canCredit = creditBlock(customer, amount) == null;
  const paymentType: TPaymentType = canCredit && rand() < 0.35 ? "credit" : pick(rand, ["cash", "cash", "cash", "e_wallet"]);
  const due = borrowed > 0 ? await depositDue(ctx, { customerId, borrowed: [{ containerType: "round", qty: borrowed }] }) : 0;
  const occurredAt = ctx.now.toISOString();

  await sync(day, rider, {
    opId: nextId(ID_GROUP.clientOp),
    occurredAt,
    kind: "delivery.create",
    payload: {
      id: nextId(ID_GROUP.delivery),
      tripId,
      customerId,
      lines: [{ productId: PRODUCT.roundRefill, qty, emptiesCollected, unitPrice }],
      paymentType,
      deposit: due > 0 ? { method: "cash", lines: [{ containerType: "round", qty: borrowed, amount: due }] } : undefined,
    },
  });

  if (paymentType !== "credit" && customer.creditBalance > 0 && rand() < 0.3) {
    await sync(day, rider, {
      opId: nextId(ID_GROUP.clientOp),
      occurredAt,
      kind: "payment.create",
      payload: { id: nextId(ID_GROUP.payment), customerId, amount: customer.creditBalance, method: "cash", tripId },
    });
  }
};

const runTrip = async (day: TSeedDay, { rider, slot, status }: { rider: TActor; slot: number; status: TTripStatus }) => {
  const { db, rand } = day;

  const customers: { id: string; riderId: string | null }[] = await db("customers")
    .where((query) => query.where({ riderId: rider.id }).orWhereNull("riderId"))
    .orderBy("id")
    .select("id", "riderId");

  const stops = customers.filter(({ riderId }) => rand() < (riderId === rider.id ? 0.7 : 0.08));
  const [first] = customers;

  if (stops.length === 0 && first) {
    stops.push(first);
  }

  const loaded = stops.length * 3 + between(rand, 0, 2);
  const cashier = day.ctxFor(SEED_ACTOR.cashier, clock(7 * 60 + 30 + slot * 15));
  const { id: tripId } = await loadOutTrip(cashier, { riderId: rider.id, lines: [{ productId: PRODUCT.roundRefill, loaded }] });

  for (const [i, { id: customerId }] of stops.entries()) {
    await deliver(day, { rider, tripId, customerId, time: clock(9 * 60 + slot * 10 + i * 40) });
  }

  if (status === "open") {
    return;
  }

  await sync(day, rider, {
    opId: nextId(ID_GROUP.clientOp),
    occurredAt: day.at(clock(15 * 60 + 30 + slot * 15)).toISOString(),
    kind: "trip.end",
    payload: { tripId },
  });

  if (status === "returning") {
    return;
  }

  const receiver = day.ctxFor(SEED_ACTOR.cashier, clock(16 * 60 + slot * 15));
  const { lines, expectedCash } = await getTripDetail(receiver, tripId);

  await receiveTrip(receiver, {
    tripId,
    lines: lines.map(({ productId, expectedFull, emptiesCollected }) => ({ productId, returnedFull: expectedFull, returnedEmpty: emptiesCollected })),
    cashRemitted: expectedCash,
  });

  if (status === "reconciled") {
    await reconcileTrip(day.ctxFor(SEED_ACTOR.owner, clock(17 * 60 + 30 + slot * 10)), tripId);
  }
};

export const hook: THistoryHook = {
  async day(day) {
    const isSunday = new Date(`${day.date}T12:00:00+08:00`).getUTCDay() === SUNDAY;

    if (isSunday && !day.isToday) {
      return;
    }

    const riders = day.isToday || day.rand() < 0.5 ? [SEED_ACTOR.rider1, SEED_ACTOR.rider2, SEED_ACTOR.multi] : [SEED_ACTOR.rider1, SEED_ACTOR.rider2];

    for (const [slot, rider] of riders.entries()) {
      await runTrip(day, { rider, slot, status: day.isToday ? (TODAY_STATUSES[slot] ?? "reconciled") : "reconciled" });
    }
  },
};
