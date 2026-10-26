import type { TMaintenanceStatus } from "@wrs/contract/maintenance";

import type { TTone } from "@/types/ui";

export const MAINTENANCE_STATUS_TONE: Record<TMaintenanceStatus, TTone> = {
  ok: "ok",
  due: "warn",
  overdue: "danger",
};

export const MAINTENANCE_STATUS_LABEL: Record<TMaintenanceStatus, string> = {
  ok: "OK",
  due: "Due soon",
  overdue: "Overdue",
};
