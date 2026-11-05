import type { TTableColumn } from "@/types";

export const APPROVAL_DECISION_COLUMNS: TTableColumn[] = [
  { key: "decision", label: "Decision" },
  { key: "decidedByName", label: "Decided by" },
  { key: "decisionReason", label: "Reason" },
];
