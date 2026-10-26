import type { TTripStatus } from "../trip.ts";

export const TRIP_STATUS_LABEL: Record<TTripStatus, string> = {
  open: "Open",
  returning: "Returning",
  returned: "Returned",
  reconciled: "Reconciled",
};
