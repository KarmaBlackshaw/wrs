import { consumables } from "@/mocks/consumables";
import { maintenanceLogs } from "@/mocks/maintenance";
import { meterReadings } from "@/mocks/meterReadings";

export function maintenanceStates() {
  const latestMeterLiters = Math.max(...meterReadings.map((reading) => reading.liters));

  return consumables
    .filter((consumable) => consumable.kind === "maintenance")
    .map((consumable) => ({ consumable, state: computeMaintenanceState(consumable, maintenanceLogs, latestMeterLiters) }));
}
