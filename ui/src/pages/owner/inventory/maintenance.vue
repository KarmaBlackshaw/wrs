<script setup lang="ts">
import { IconPackage } from "@/components";
import { consumables } from "@/mocks/consumables";
import { maintenanceLogs as maintenanceLogsMock } from "@/mocks/maintenance";
import { meterReadings } from "@/mocks/meterReadings";
import { type TConsumable, type TMaintenanceLog, type TRowAction, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Maintenance" } });

const maintenanceLogs = ref<TMaintenanceLog[]>([...maintenanceLogsMock]);
const latestMeterLiters = computed(() => Math.max(...meterReadings.map((reading) => reading.liters)));

const columns = [
  { key: "name", label: "Item" },
  { key: "status", label: "Status" },
  { key: "lastReplaced", label: "Last replaced" },
  { key: "notes", label: "Notes" },
];

const rows = computed(() =>
  consumables
    .filter((consumable) => consumable.kind === "maintenance")
    .map((item) => ({ item, state: computeMaintenanceState(item, maintenanceLogs.value, latestMeterLiters.value) }))
);

const statusTone = {
  ok: "ok",
  due: "warn",
  overdue: "danger",
} as const;

const statusLabel = {
  ok: "OK",
  due: "Due soon",
  overdue: "Overdue",
} as const;

const logSheetItem = ref<TConsumable>();

function logReplacement(item: TConsumable, meterLiters: number) {
  maintenanceLogs.value.push({
    id: `maint-${maintenanceLogs.value.length + 1}`,
    consumableId: item.id,
    at: new Date().toISOString(),
    meterLiters,
  });
}

function maintenanceActions({ item }: { item: TConsumable }): TRowAction[] {
  return [{ label: "Log replacement", onSelect: () => (logSheetItem.value = item) }];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="maintenanceActions"
      title="Inventory"
      :icon="IconPackage"
      :tabs="OWNER_TABS.INVENTORY"
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.item.id"
    >
      <template #cell-name="{ row }">{{ row.item.name }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="statusTone[row.state.status]">{{ statusLabel[row.state.status] }}</UiStatusPill>
      </template>
      <template #cell-lastReplaced="{ row }">{{ row.state.lastReplacedAt ? formatDate(row.state.lastReplacedAt) : "Never" }}</template>
      <template #cell-notes="{ row }">
        {{ row.state.litersSince !== null ? `${row.state.litersSince.toLocaleString()} L since replacement` : "No meter baseline yet" }}
        <span v-if="row.item.intervalLiters"> · interval {{ row.item.intervalLiters.toLocaleString() }} L</span>
        <span v-if="row.item.intervalDays"> · every {{ row.item.intervalDays }} days</span>
      </template>
      <template #empty>
        <UiEmptyState title="No maintenance items yet" />
      </template>
    </UiDataTable>

    <MaintenanceLogSheet v-model:item="logSheetItem" :latest-meter-liters="latestMeterLiters" @submit="logReplacement" />
  </div>
</template>
