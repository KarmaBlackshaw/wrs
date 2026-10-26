import type { TMaintenanceItem, TMaintenanceLogBody } from "@wrs/contract/maintenance";

import { http } from "@/lib/http";

export function listMaintenance(signal?: AbortSignal) {
  return http.get<TMaintenanceItem[]>("/maintenance", { signal });
}

export function createMaintenanceLog(body: TMaintenanceLogBody) {
  return http.post<TMaintenanceItem>("/maintenance-logs", body);
}
