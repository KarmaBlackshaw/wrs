import { getCustomer } from "../../src/domain/customer.ts";
import { recordPayment } from "../../src/domain/payment.ts";
import { ID_GROUP } from "../ids/index.ts";
import { SEED_ACTOR, between, clock, nextId, pick, type THistoryHook } from "../ids/history.ts";

export const hook: THistoryHook = {
  async day({ db, rand, ctxFor }) {
    const customers: { id: string }[] = await db("customers").where({ creditEnabled: true }).orderBy("id").select("id");

    for (const { id: customerId } of customers) {
      const ctx = ctxFor(SEED_ACTOR.cashier, clock(between(rand, 10 * 60, 17 * 60)));
      const { creditBalance } = await getCustomer(ctx, customerId);

      if (creditBalance > 0 && rand() < 0.2) {
        const amount = rand() < 0.6 ? creditBalance : Math.max(100, Math.round(creditBalance / 200) * 100);

        await recordPayment(ctx, { id: nextId(ID_GROUP.payment), customerId, amount, method: pick(rand, ["cash", "cash", "e_wallet"]) });
      }
    }
  },
};
