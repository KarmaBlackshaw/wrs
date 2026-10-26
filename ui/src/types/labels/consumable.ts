import type { TConsumableKind, TStockEntryKind, TStockStatus } from "@wrs/contract/consumable";

import type { TOption, TTone } from "@/types/ui";

export { STOCK_STATUS_LABEL } from "@wrs/contract/labels/consumable";

export const CONSUMABLE_KIND_LABEL: Record<TConsumableKind, string> = {
  per_unit: "Per unit sold",
  maintenance: "Maintenance",
  general: "General",
};

export const CONSUMABLE_KIND_OPTIONS: TOption<TConsumableKind>[] = [
  { value: "per_unit", label: CONSUMABLE_KIND_LABEL.per_unit },
  { value: "maintenance", label: CONSUMABLE_KIND_LABEL.maintenance },
  { value: "general", label: CONSUMABLE_KIND_LABEL.general },
];

export const STOCK_ENTRY_KIND_LABEL: Record<TStockEntryKind, string> = {
  restock: "Restock",
  stock_take: "Stock-take",
  usage: "Usage",
  maintenance: "Maintenance",
  void: "Void",
  expense_reversal: "Expense reversal",
};

export const STOCK_STATUS_TONE: Record<TStockStatus, TTone> = {
  ok: "ok",
  soon: "warn",
  reorder: "danger",
};
