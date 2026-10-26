import { recordSale } from "../../src/domain/sale.ts";
import { applyVoid, rejectVoid, requestVoid } from "../../src/domain/void.ts";
import { PRODUCT } from "../ids/index.ts";
import { SEED_ACTOR, historyWindow, pick, type THistoryHook, type TSeedDay } from "../ids/history.ts";

const REASONS = ["Customer cancelled the order", "Rung up the wrong product", "Entered twice by mistake"] as const;

const { dates } = historyWindow();

const daysAgo = (date: string) => dates.length - 1 - dates.indexOf(date);

const pendingBulkVoid = async (day: TSeedDay) => {
  const sale = await recordSale(day.ctxFor(SEED_ACTOR.cashier, "10:30"), {
    lines: [{ productId: PRODUCT.bottled, qty: 40, borrowed: 0, returned: 0 }],
    paymentType: "cash",
  });

  return requestVoid(day.ctxFor(SEED_ACTOR.cashier, "10:45"), { refType: "walk_in_sale", refId: sale.id, reason: pick(day.rand, REASONS) });
};

export const hook: THistoryHook = {
  async day(day) {
    const { db, rand, isToday, ctxFor, cashierSession } = day;
    const ago = daysAgo(day.date);

    if (isToday) {
      await pendingBulkVoid(day);

      return;
    }

    if (ago === 2) {
      const { id } = await pendingBulkVoid(day);

      await rejectVoid(ctxFor(SEED_ACTOR.owner, "18:30"), id, { reason: "The sale went through, keep it" });

      return;
    }

    if (ago === 9) {
      const { id } = await pendingBulkVoid(day);

      await applyVoid(ctxFor(SEED_ACTOR.owner, "18:30"), { voidId: id });

      return;
    }

    if (rand() >= 0.15) {
      return;
    }

    const sale: { id: string } | undefined = await db("walkInSales")
      .where({ drawerSessionId: cashierSession.id })
      .whereNull("voidedAt")
      .orderBy("createdAt", "desc")
      .first("id");

    if (sale) {
      await requestVoid(ctxFor(SEED_ACTOR.cashier, "18:00"), { refType: "walk_in_sale", refId: sale.id, reason: pick(rand, REASONS) });
    }
  },
};
