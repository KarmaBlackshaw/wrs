import type { TPayFrequency, TRateBasis } from "@wrs/contract/employee";

export type { TPayFrequency, TRateBasis };

export type TPayPlan = {
  employeeId: string;
  frequency: TPayFrequency;
  rateBasis: TRateBasis;
  baseRate: number;
  quota?: number;
  incentivePerContainer?: number;
  deductionCapPct?: number;
  effectiveFrom: string;
  effectiveTo?: string;
};

export type TPayRunStatus = "draft" | "finalized";

export type TPayRun = {
  id: string;
  frequency: TPayFrequency;
  periodStart: string;
  periodEnd: string;
  status: TPayRunStatus;
};

export type TPayLineDeduction = {
  kind: "advance" | "loan" | "shortage";
  refId: string;
  amount: number;
};

export type TPayLine = {
  runId: string;
  employeeId: string;
  daysWorked: number;
  delivered: number;
  base: number;
  incentive: number;
  adjustments: number;
  deductions: TPayLineDeduction[];
  net: number;
};
