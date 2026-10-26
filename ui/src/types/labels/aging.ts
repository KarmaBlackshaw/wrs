import type { TAgingBucket } from "@/types/entities/customer";
import type { TTone } from "@/types/ui";

export const AGING_TONE: Record<TAgingBucket, TTone> = {
  current: "ok",
  "7": "warn",
  "15": "warn",
  "30+": "danger",
};

export const AGING_LABEL: Record<TAgingBucket, string> = {
  current: "Current",
  "7": "7 days",
  "15": "15 days",
  "30+": "30+ days",
};
