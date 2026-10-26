import { prices } from "@/mocks/products";

export function currentPrice(productId: string, onDate?: string) {
  return (
    latestEffective(
      prices.filter((price) => price.productId === productId),
      onDate
    )?.amount ?? 0
  );
}
