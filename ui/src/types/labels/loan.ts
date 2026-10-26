import { LOAN_STATUS_LABEL, LOAN_TYPE_LABEL } from "@wrs/contract/labels/loan";
import type { TLoanMethod, TLoanStatus, TLoanType } from "@wrs/contract/loan";

import type { TOption, TTone } from "@/types/ui";

export { LOAN_STATUS_LABEL, LOAN_TYPE_LABEL };

export const LOAN_STATUS_TONE: Record<TLoanStatus, TTone> = {
  requested: "info",
  approved: "warn",
  released: "neutral",
  paid: "ok",
  rejected: "danger",
};

export const LOAN_METHOD_LABEL: Record<TLoanMethod, string> = {
  flat: "Flat",
  diminishing: "Diminishing balance",
};

export const LOAN_METHOD_OPTIONS: TOption<TLoanMethod>[] = [
  { value: "flat", label: LOAN_METHOD_LABEL.flat },
  { value: "diminishing", label: LOAN_METHOD_LABEL.diminishing },
];

export const LOAN_TYPE_OPTIONS: TOption<TLoanType>[] = [
  { value: "advance", label: LOAN_TYPE_LABEL.advance },
  { value: "loan", label: LOAN_TYPE_LABEL.loan },
];
