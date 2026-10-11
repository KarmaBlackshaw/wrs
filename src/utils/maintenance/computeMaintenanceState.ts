import dayjs from "dayjs";

import type { TConsumable, TMaintenanceDueStatus, TMaintenanceLog, TMaintenanceState } from "@/types";

export function computeMaintenanceState(consumable: TConsumable, logs: TMaintenanceLog[], latestMeterLiters: number, now = new Date()): TMaintenanceState {
  const lastLog = logs.filter((log) => log.consumableId === consumable.id).sort((a, b) => b.at.localeCompare(a.at))[0];

  const litersSince = lastLog ? latestMeterLiters - lastLog.meterLiters : null;
  const daysSince = lastLog ? dayjs(now).diff(new Date(lastLog.at), "day") : null;

  const literRatio = consumable.intervalLiters && litersSince !== null ? litersSince / consumable.intervalLiters : 0;
  const dayRatio = consumable.intervalDays && daysSince !== null ? daysSince / consumable.intervalDays : 0;
  const ratio = Math.max(literRatio, dayRatio);

  const status: TMaintenanceDueStatus = ratio >= 1 ? "overdue" : ratio >= 0.8 ? "due" : "ok";

  return { lastReplacedAt: lastLog?.at ?? null, litersSince, daysSince, status };
}
