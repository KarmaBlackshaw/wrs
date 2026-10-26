import type { TStockStatus } from "../consumable.ts";

export const STOCK_STATUS_LABEL: Record<TStockStatus, string> = {
  ok: "OK",
  soon: "Reorder soon",
  reorder: "Reorder now",
};
