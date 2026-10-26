import type { TAgingBucket } from "@wrs/contract/customer";
import type { TTone } from "@/types/ui";

export { AGING_LABEL } from "@wrs/contract/labels/customer";

export const AGING_TONE: Record<TAgingBucket, TTone> = {
  current: "ok",
  "7": "warn",
  "15": "warn",
  "30+": "danger",
};
