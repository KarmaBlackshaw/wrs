import type { TSetting } from "@/types";

export const settings: TSetting[] = [
  { key: "rider.dailyQuota", value: 100, effectiveFrom: "2026-01-01" },
  { key: "rider.incentivePerContainer", value: null, effectiveFrom: "2026-01-01" },
  { key: "pay.frequency", value: null, effectiveFrom: "2026-01-01" },
  { key: "pay.baseRate", value: null, effectiveFrom: "2026-01-01" },
  { key: "loan.interestRatePct", value: null, effectiveFrom: "2026-01-01" },
  { key: "loan.interestMethod", value: null, effectiveFrom: "2026-01-01" },
  { key: "loan.maxAmount", value: null, effectiveFrom: "2026-01-01" },
  { key: "loan.maxTermMonths", value: null, effectiveFrom: "2026-01-01" },
  { key: "pay.deductionCapPct", value: null, effectiveFrom: "2026-01-01" },
  { key: "container.depositAmount.round", value: 20000, effectiveFrom: "2026-01-01" },
  { key: "container.depositAmount.slim", value: 15000, effectiveFrom: "2026-01-01" },
  { key: "customer.creditLimit", value: null, effectiveFrom: "2026-01-01" },
  { key: "void.approvalThreshold", value: null, effectiveFrom: "2026-01-01" },
  { key: "water.tdsAcceptableRangePpm", value: null, effectiveFrom: "2026-01-01" },
  { key: "labTest.reminderDays", value: null, effectiveFrom: "2026-01-01" },
  { key: "digest.sendTime", value: "end-of-day", effectiveFrom: "2026-01-01" },
];
