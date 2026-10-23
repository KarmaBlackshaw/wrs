import type { TPrice, TProduct } from "@/types";

export const products: TProduct[] = [
  { id: "prod-1", name: "Round Container Refill", kind: "refill", containerType: "round", active: true },
  { id: "prod-2", name: "Slim Container Refill", kind: "refill", containerType: "slim", active: true },
  { id: "prod-3", name: "Round Container (new)", kind: "container", containerType: "round", active: true },
  { id: "prod-4", name: "Slim Container (new)", kind: "container", containerType: "slim", active: true },
  { id: "prod-5", name: "Bottled Water 500mL", kind: "bottled", active: true },
  { id: "prod-6", name: "Ice, per bag", kind: "other", active: true },
];

export const prices: TPrice[] = [
  { productId: "prod-1", amount: 3000, effectiveFrom: "2025-06-01" },
  { productId: "prod-1", amount: 3500, effectiveFrom: "2026-01-01" },
  { productId: "prod-2", amount: 2500, effectiveFrom: "2025-06-01" },
  { productId: "prod-2", amount: 3000, effectiveFrom: "2026-01-01" },
  { productId: "prod-3", amount: 25000, effectiveFrom: "2025-06-01" },
  { productId: "prod-4", amount: 18000, effectiveFrom: "2025-06-01" },
  { productId: "prod-5", amount: 1500, effectiveFrom: "2025-06-01" },
  { productId: "prod-6", amount: 5000, effectiveFrom: "2025-06-01" },
];
