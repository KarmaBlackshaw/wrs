import type { TMaintenanceStatus } from "../maintenance.ts";

export const MAINTENANCE_STATUS_LABEL: Record<TMaintenanceStatus, string> = {
  ok: "OK",
  due: "Due soon",
  overdue: "Overdue",
};
