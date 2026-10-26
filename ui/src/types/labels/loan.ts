import type { TLoanMethod } from "@wrs/contract/setting";

import type { TLoanStatus } from "@/types/entities/loan";
import type { TOption, TTone } from "@/types/ui";

export const LOAN_STATUS_TONE: Record<TLoanStatus, TTone> = {
  requested: "info",
  approved: "warn",
  released: "neutral",
  paid: "ok",
  rejected: "danger",
};

export const LOAN_STATUS_LABEL: Record<TLoanStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  released: "Released",
  paid: "Paid",
  rejected: "Rejected",
};

export const LOAN_METHOD_LABEL: Record<TLoanMethod, string> = {
  flat: "Flat",
  diminishing: "Diminishing balance",
};

export const LOAN_METHOD_OPTIONS: TOption<TLoanMethod>[] = [
  { value: "flat", label: LOAN_METHOD_LABEL.flat },
  { value: "diminishing", label: LOAN_METHOD_LABEL.diminishing },
];
