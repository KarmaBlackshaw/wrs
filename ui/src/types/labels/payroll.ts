import type { TPayFrequency, TPayLineDeduction } from "@/types/entities/payroll";
import type { TOption } from "@/types/ui";

export const DEDUCTION_LABEL: Record<TPayLineDeduction["kind"], string> = {
  advance: "Advance",
  loan: "Loan installment",
  shortage: "Approved shortage",
};

export const PAY_FREQUENCY_LABEL: Record<TPayFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  "semi-monthly": "Semi-monthly",
  monthly: "Monthly",
};

export const PAY_FREQUENCY_OPTIONS: TOption<TPayFrequency>[] = [
  { value: "daily", label: PAY_FREQUENCY_LABEL.daily },
  { value: "weekly", label: PAY_FREQUENCY_LABEL.weekly },
  { value: "semi-monthly", label: PAY_FREQUENCY_LABEL["semi-monthly"] },
  { value: "monthly", label: PAY_FREQUENCY_LABEL.monthly },
];
