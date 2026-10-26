import type { TPaymentType, TWalkInSaleBody } from "@wrs/contract/sale";
import { creditBlock } from "@wrs/contract/rules/creditBlock";
import { getCustomer } from "../../src/domain/customer.ts";
import { quoteSale, recordSale } from "../../src/domain/sale.ts";
import type { TCtx } from "../../src/lib/context/makeCtx.ts";
import { PRODUCT } from "../ids/index.ts";
import { SEED_ACTOR, between, clock, pick, type THistoryHook } from "../ids/history.ts";

type TLines = TWalkInSaleBody["lines"];

const anonymousLines = (rand: () => number): TLines => {
  const line = (productId: string, max: number) => ({ productId, qty: between(rand, 1, max), borrowed: 0, returned: 0 });

  return pick(rand, [
    [line(PRODUCT.bottled, 6)],
    [line(PRODUCT.ice, 3)],
    [line(PRODUCT.slimRefill, 2)],
    [line(PRODUCT.roundRefill, 3)],
    [line(PRODUCT.roundRefill, 2), line(PRODUCT.ice, 2)],
    [line(PRODUCT.slimRefill, 2), line(PRODUCT.bottled, 4)],
  ]);
};

const customerSale = async (ctx: TCtx, rand: () => number, customerId: string): Promise<TWalkInSaleBody> => {
  const customer = await getCustomer(ctx, customerId);
  const qty = between(rand, 1, 2);
  const lines: TLines = [{ productId: PRODUCT.roundRefill, qty, borrowed: qty, returned: Math.min(customer.heldByType.round ?? 0, qty) }];
  const { amount, depositDue, depositLines } = await quoteSale(ctx, { customerId, lines, paymentType: "cash" });
  const canCredit = creditBlock(customer, amount) == null;
  const paymentType: TPaymentType = canCredit && rand() < 0.4 ? "credit" : "cash";

  return { customerId, lines, paymentType, deposit: depositDue > 0 ? { method: "cash", lines: depositLines } : undefined };
};

export const hook: THistoryHook = {
  async day({ db, rand, ctxFor }) {
    const customers: { id: string }[] = await db("customers").orderBy("id").select("id");
    const times = Array.from({ length: between(rand, 6, 12) }, () => between(rand, 8 * 60, 18 * 60)).toSorted((a, b) => a - b);

    for (const time of times) {
      const ctx = ctxFor(SEED_ACTOR.cashier, clock(time));
      const customer = rand() < 0.35 ? customers[Math.floor(rand() * customers.length)] : undefined;

      const body: TWalkInSaleBody = customer
        ? await customerSale(ctx, rand, customer.id)
        : { lines: anonymousLines(rand), paymentType: pick(rand, ["cash", "cash", "cash", "e_wallet"]) };

      await recordSale(ctx, body);
    }
  },
};
