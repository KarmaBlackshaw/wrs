import type { TAgingBucket } from "../customer.ts";

export const AGING_LABEL: Record<TAgingBucket, string> = {
  current: "Current",
  "7": "7 days",
  "15": "15 days",
  "30+": "30+ days",
};
