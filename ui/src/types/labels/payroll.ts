import type { TPayFrequency, TRateBasis } from "@wrs/contract/employee";
import type { TPayLineDeductionKind, TPayRunStatus } from "@wrs/contract/payroll";
import type { TOption, TTone } from "@/types/ui";

export const DEDUCTION_LABEL: Record<TPayLineDeductionKind, string> = {
  advance: "Advance",
  loan: "Loan installment",
  shortage: "Shortage",
  credit: "Credit held",
  unpaid_leave: "Unpaid leave",
  carry_over: "Carried over",
};

export const PAY_RUN_STATUS_LABEL: Record<TPayRunStatus, string> = {
  draft: "Draft",
  finalized: "Finalized",
};

export const PAY_RUN_STATUS_TONE: Record<TPayRunStatus, TTone> = {
  draft: "warn",
  finalized: "ok",
};

export const PAY_FREQUENCY_LABEL: Record<TPayFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  semi_monthly: "Semi-monthly",
  monthly: "Monthly",
};

export const PAY_FREQUENCY_OPTIONS: TOption<TPayFrequency>[] = [
  { value: "daily", label: PAY_FREQUENCY_LABEL.daily },
  { value: "weekly", label: PAY_FREQUENCY_LABEL.weekly },
  { value: "semi_monthly", label: PAY_FREQUENCY_LABEL.semi_monthly },
  { value: "monthly", label: PAY_FREQUENCY_LABEL.monthly },
];

export const RATE_BASIS_LABEL: Record<TRateBasis, string> = {
  per_day: "Per day",
  per_period: "Per period",
};

export const RATE_BASIS_OPTIONS: TOption<TRateBasis>[] = [
  { value: "per_day", label: RATE_BASIS_LABEL.per_day },
  { value: "per_period", label: RATE_BASIS_LABEL.per_period },
];

export const REST_WEEKDAY_OPTIONS: TOption<number>[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
