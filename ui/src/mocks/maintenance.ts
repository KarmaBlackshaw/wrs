import type { TMaintenanceLog } from "@/types";

export const maintenanceLogs: TMaintenanceLog[] = [
  { id: "maint-1", consumableId: "cons-3", at: "2026-07-01T09:00:00+08:00", meterLiters: 65000 },
  { id: "maint-2", consumableId: "cons-4", at: "2026-01-15T09:00:00+08:00", meterLiters: 10000 },
  { id: "maint-3", consumableId: "cons-5", at: "2026-04-01T09:00:00+08:00", meterLiters: 40000 },
];
