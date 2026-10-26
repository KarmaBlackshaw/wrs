import { TRIP_STATUS_LABEL } from "@wrs/contract/labels/trip";
import type { TTripStatus } from "@wrs/contract/trip";
import type { TTone } from "@/types/ui";
import type { TOption } from "@/types";

export { TRIP_STATUS_LABEL };

export const TRIP_STATUS_TONE: Record<TTripStatus, TTone> = {
  open: "info",
  returning: "neutral",
  returned: "warn",
  reconciled: "ok",
};

export const TRIP_STATUS_FILTER_OPTIONS: TOption<"all" | TTripStatus>[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: TRIP_STATUS_LABEL.open },
  { value: "returning", label: TRIP_STATUS_LABEL.returning },
  { value: "returned", label: TRIP_STATUS_LABEL.returned },
  { value: "reconciled", label: TRIP_STATUS_LABEL.reconciled },
];
