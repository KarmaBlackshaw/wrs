import type { TPrice } from "../product.ts";

type TPricePoint = Pick<TPrice, "amount" | "effectiveFrom">;

export function priceAt(prices: TPricePoint[], at: string): number | undefined {
  let latest: TPricePoint | undefined;

  for (const price of prices) {
    if (price.effectiveFrom <= at && (latest == null || price.effectiveFrom > latest.effectiveFrom)) {
      latest = price;
    }
  }

  return latest?.amount;
}
