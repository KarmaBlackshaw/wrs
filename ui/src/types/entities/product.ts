import type { TContainerTypeCode } from "@/types/entities/container";

export type TProductKind = "refill" | "container" | "bottled" | "other";

export type TProduct = {
  id: string;
  name: string;
  kind: TProductKind;
  containerType?: TContainerTypeCode;
  active: boolean;
};

export type TPrice = {
  productId: string;
  amount: number;
  effectiveFrom: string;
};
