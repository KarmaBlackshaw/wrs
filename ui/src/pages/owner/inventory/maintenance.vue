<script setup lang="ts">
import type { TMaintenanceItem } from "@wrs/contract/maintenance";

import { IconPackage } from "@/components";
import { listMaintenance } from "@/services/maintenance";
import { listMeterReadings } from "@/services/meterReading";
import { MAINTENANCE_STATUS_LABEL, MAINTENANCE_STATUS_TONE, OWNER_TABS, type TRowAction } from "@/types";

definePage({ meta: { title: "Maintenance" } });

const { data, isLoading, error, reload: reloadItems } = useResource((signal) => listMaintenance(signal));
const { data: readings, reload: reloadReadings } = useResource((signal) => listMeterReadings({ page: 1 }, signal));

const latestMeterLiters = computed(() => readings.value?.items[0]?.liters);

const columns = [
  { key: "name", label: "Item" },
  { key: "status", label: "Status" },
  { key: "lastReplaced", label: "Last replaced" },
  { key: "notes", label: "Notes" },
];

const logSheetItem = ref<TMaintenanceItem>();

function maintenanceActions(item: TMaintenanceItem): TRowAction[] {
  return [{ label: "Log replacement", onSelect: () => (logSheetItem.value = item) }];
}

function reload() {
  reloadItems();
  reloadReadings();
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
      :rows="data ?? []"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.consumableId"
      @retry="reloadItems"
    >
      <template #cell-status="{ row }">
        <UiStatusPill :tone="MAINTENANCE_STATUS_TONE[row.status]">{{ MAINTENANCE_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-lastReplaced="{ row }">{{ row.lastReplacedAt != null ? formatDate(row.lastReplacedAt) : "Never" }}</template>
      <template #cell-notes="{ row }">
        {{ row.litersSince != null ? `${row.litersSince.toLocaleString()} L since replacement` : "No meter baseline yet" }}
        <span v-if="row.intervalLiters != null"> · interval {{ row.intervalLiters.toLocaleString() }} L</span>
        <span v-if="row.intervalDays != null"> · every {{ row.intervalDays }} days</span>
      </template>
      <template #empty>
        <UiEmptyState title="No maintenance items yet" />
      </template>
    </UiDataTable>

    <MaintenanceLogSheet v-model:item="logSheetItem" :latest-meter-liters="latestMeterLiters" @submit="reload" />
  </div>
</template>
