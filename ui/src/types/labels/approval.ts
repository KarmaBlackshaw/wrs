import type { TApprovalDecision } from "@wrs/contract/approval";
import type { TVoidRefType } from "@wrs/contract/void";

import type { TTone } from "@/types/ui";

export const DECISION_LABEL: Record<TApprovalDecision, string> = {
  approved: "Approved",
  rejected: "Rejected",
  accepted: "Accepted",
  voided: "Voided",
};

export const DECISION_TONE: Record<TApprovalDecision, TTone> = {
  approved: "ok",
  accepted: "ok",
  rejected: "danger",
  voided: "danger",
};

export const VOID_SOURCE_LABEL: Record<TVoidRefType, string> = {
  delivery: "delivery",
  walk_in_sale: "walk-in sale",
  payment: "payment",
};
