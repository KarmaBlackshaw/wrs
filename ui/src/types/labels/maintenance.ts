import type { TMaintenanceStatus } from "@wrs/contract/maintenance";

import type { TTone } from "@/types/ui";

export { MAINTENANCE_STATUS_LABEL } from "@wrs/contract/labels/maintenance";

export const MAINTENANCE_STATUS_TONE: Record<TMaintenanceStatus, TTone> = {
  ok: "ok",
  due: "warn",
  overdue: "danger",
};
