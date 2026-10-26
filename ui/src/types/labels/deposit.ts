import type { TDepositKind } from "@wrs/contract/deposit";

export const DEPOSIT_KIND_LABEL: Record<TDepositKind, string> = {
  collected: "Collected",
  refunded: "Refunded",
  forfeited: "Forfeited",
  waived: "Waived",
};
