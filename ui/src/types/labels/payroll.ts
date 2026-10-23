import type { TPayFrequency, TRateBasis } from "@wrs/contract/employee";
import type { TPayLineDeduction } from "@/types/entities/payroll";
import type { TOption } from "@/types/ui";

export const DEDUCTION_LABEL: Record<TPayLineDeduction["kind"], string> = {
  advance: "Advance",
  loan: "Loan installment",
  shortage: "Approved shortage",
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
