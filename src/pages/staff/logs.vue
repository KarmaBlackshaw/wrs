<script setup lang="ts">
import { IconClipboardText } from "@/components";
import { meterReadings } from "@/mocks/meterReadings";
import { waterReadings } from "@/mocks/waterQuality";

definePage({ meta: { title: "Readings" } });

const employeeStore = useEmployeeStore();

const logColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "label", label: "Type" },
  { key: "detail", label: "Detail" },
  { key: "status", label: "Status" },
  { key: "time", label: "Time", align: "right" },
];

const rows = computed(() => {
  const water = waterReadings.map((reading) => ({
    id: `water-${reading.id}`,
    kind: "water" as const,
    label: "Water quality",
    detail: `TDS ${reading.tds} ppm${reading.ph ? ` · pH ${reading.ph}` : ""} · ${employeeStore.employeeName(reading.by)}`,
    outOfRange: isTdsOutOfRange(reading.tds),
    at: reading.at,
  }));

  const meter = meterReadings.map((reading) => ({
    id: `meter-${reading.id}`,
    kind: "meter" as const,
    label: "Meter reading",
    detail: `${reading.liters?.toLocaleString() ?? 0} L · ${employeeStore.employeeName(reading.by)}`,
    outOfRange: false,
    at: reading.at,
  }));

  return [...water, ...meter].sort((a, b) => (a.at < b.at ? 1 : -1));
});

const sheetOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable title="Readings" :icon="IconClipboardText" :columns="logColumns" :rows="rows" :row-key="(row) => row.id">
      <template #actions>
        <UiButton @click="sheetOpen = true">Log reading</UiButton>
      </template>
      <template #cell-detail="{ row }">
        <div class="flex flex-col gap-0.5">
          <span>{{ row.detail }}</span>
          <span v-if="row.outOfRange" class="text-sm font-medium text-red-700">Out of range, retest before selling</span>
        </div>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="row.kind === 'water'" :tone="row.outOfRange ? 'danger' : 'ok'">{{ row.outOfRange ? "Out of range" : "OK" }}</UiStatusPill>
      </template>
      <template #cell-time="{ row }">{{ formatTime(row.at) }}</template>
      <template #empty>
        <UiEmptyState title="No readings yet" description="Log a TDS, pH or meter reading to get started." />
      </template>
    </UiDataTable>

    <WaterReadingSheet v-model:open="sheetOpen" />
  </div>
</template>
