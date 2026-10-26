import type { TPaymentType, TSaleSource } from "../sale.ts";

export const PAYMENT_LABEL: Record<TPaymentType, string> = {
  cash: "Cash",
  e_wallet: "E-wallet",
  credit: "Credit",
};

export const SALE_SOURCE_LABEL: Record<TSaleSource, string> = {
  walk_in: "Walk-in",
  delivery: "Delivery",
};
