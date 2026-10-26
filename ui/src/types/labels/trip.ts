import type { TTripStatus } from "@/types/entities/trip";
import type { TTone } from "@/types/ui";

export const TRIP_STATUS_TONE: Record<TTripStatus, TTone> = {
  open: "info",
  returned: "warn",
  reconciled: "ok",
};

export const TRIP_STATUS_LABEL: Record<TTripStatus, string> = {
  open: "Open",
  returned: "Returned",
  reconciled: "Reconciled",
};
