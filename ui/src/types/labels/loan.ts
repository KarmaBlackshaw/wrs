import type { TLoanStatus } from "@/types/entities/loan";
import type { TTone } from "@/types/ui";

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
