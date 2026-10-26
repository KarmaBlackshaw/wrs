import type { TTripStatus } from "@wrs/contract/trip";
import type { TTone } from "@/types/ui";

export const TRIP_STATUS_TONE: Record<TTripStatus, TTone> = {
  open: "info",
  returning: "neutral",
  returned: "warn",
  reconciled: "ok",
};

export const TRIP_STATUS_LABEL: Record<TTripStatus, string> = {
  open: "Open",
  returning: "Returning",
  returned: "Returned",
  reconciled: "Reconciled",
};
