import type { TLoanStatus, TLoanType } from "../loan.ts";

export const LOAN_STATUS_LABEL: Record<TLoanStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  released: "Released",
  paid: "Paid",
  rejected: "Rejected",
};

export const LOAN_TYPE_LABEL: Record<TLoanType, string> = {
  advance: "Advance",
  loan: "Loan",
};
