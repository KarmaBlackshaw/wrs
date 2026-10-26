import type { TContainerType } from "@wrs/contract/container";
import type { TSettingEntry, TSettingKey, TSettingValues } from "@wrs/contract/setting";

export type TSettingTarget = { kind: "setting"; entry: TSettingEntry } | { kind: "deposit"; containerType: TContainerType };

export type TSettingKind = "money" | "number" | "enum" | "range" | "roleMoney" | "time";

export const SETTING_LABEL: Record<TSettingKey, string> = {
  "rider.dailyQuota": "Rider daily quota",
  "rider.incentivePerContainer": "Incentive per container above quota",
  "pay.frequency": "Pay frequency",
  "pay.baseRate": "Base rate",
  "pay.deductionCapPct": "Deduction cap",
  "loan.interestRatePct": "Loan interest rate",
  "loan.interestMethod": "Loan interest method",
  "loan.maxAmount": "Max loan amount",
  "loan.maxTermMonths": "Max loan term",
  "customer.creditLimit": "Customer credit limit",
  "void.approvalThreshold": "Void approval threshold",
  "water.tdsRangePpm": "TDS acceptable range",
  "labTest.reminderDays": "Lab test reminder",
  "digest.sendTime": "Digest send time",
  "pto.daysPerYear": "PTO days per year",
};

export const SETTING_UNIT: Partial<Record<TSettingKey, string>> = {
  "rider.dailyQuota": "containers",
  "loan.interestRatePct": "% per month",
  "pay.deductionCapPct": "% of gross",
  "loan.maxTermMonths": "months",
  "labTest.reminderDays": "days before due",
  "water.tdsRangePpm": "ppm",
  "pto.daysPerYear": "days",
};

export const SETTING_KIND: Record<TSettingKey, TSettingKind> = {
  "rider.dailyQuota": "number",
  "rider.incentivePerContainer": "money",
  "pay.frequency": "enum",
  "pay.baseRate": "roleMoney",
  "pay.deductionCapPct": "number",
  "loan.interestRatePct": "number",
  "loan.interestMethod": "enum",
  "loan.maxAmount": "money",
  "loan.maxTermMonths": "number",
  "customer.creditLimit": "money",
  "void.approvalThreshold": "money",
  "water.tdsRangePpm": "range",
  "labTest.reminderDays": "number",
  "digest.sendTime": "time",
  "pto.daysPerYear": "number",
};

export const BASE_RATE_ROLES: readonly (keyof TSettingValues["pay.baseRate"])[] = ["rider", "cashier", "washer", "helper"];
