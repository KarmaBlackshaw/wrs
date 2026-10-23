export type TConsumableKind = "per-unit" | "maintenance" | "general";

export type TConsumable = {
  id: string;
  name: string;
  unit: string;
  kind: TConsumableKind;
  reorderLevel: number;
  intervalLiters?: number;
  intervalDays?: number;
  onHand: number;
};

export type TProductUsage = {
  productId: string;
  consumableId: string;
  qtyPerUnit: number;
};

export type TStockEntry = {
  id: string;
  consumableId: string;
  qty: number;
  reason: string;
  refId?: string;
  createdAt: string;
};
