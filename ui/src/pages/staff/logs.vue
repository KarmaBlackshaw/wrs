<script setup lang="ts">
import { IconClipboardText, IconDropFill } from "@/components";
import { listMeterReadings } from "@/services/meterReading";
import { listWaterReadings } from "@/services/waterReading";

definePage({ meta: { title: "Readings" } });

const PAGE_SIZE = 20;

const waterColumns = [
  { key: "at", label: "Time" },
  { key: "tds", label: "TDS" },
  { key: "ph", label: "pH" },
  { key: "loggedByName", label: "Logged by" },
  { key: "status", label: "Status" },
];

const meterColumns = [
  { key: "at", label: "Time" },
  { key: "liters", label: "Liters", align: "right" as const },
  { key: "loggedByName", label: "Logged by" },
];

const date = useRouteQuery("date", "", { mode: "push" });
const day = computed(() => date.value || todayIso());
const { page: waterPage, resetPageOn: resetWaterPage, clampTo: clampWater } = usePageQuery("waterPage");
const { page: meterPage, resetPageOn: resetMeterPage, clampTo: clampMeter } = usePageQuery("meterPage");

resetWaterPage(date);
resetMeterPage(date);

const {
  data: water,
  isLoading: isWaterLoading,
  error: waterError,
  reload: reloadWater,
} = useResource((signal) => listWaterReadings({ from: day.value, to: day.value, page: waterPage.value, pageSize: PAGE_SIZE }, signal), {
  watch: [day, waterPage],
});

const {
  data: meter,
  isLoading: isMeterLoading,
  error: meterError,
  reload: reloadMeter,
} = useResource((signal) => listMeterReadings({ date: day.value, page: meterPage.value, pageSize: PAGE_SIZE }, signal), {
  watch: [day, meterPage],
});

const isSheetOpen = ref(false);

function reload() {
  reloadWater();
  reloadMeter();
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="Water quality"
      :icon="IconDropFill"
      :columns="waterColumns"
      :rows="water?.items ?? []"
      :total="water?.total"
      :is-loading="isWaterLoading"
      :error="waterError?.message"
      :row-key="(row) => row.id"
      @retry="reloadWater"
    >
      <template #actions>
        <UiButton @click="isSheetOpen = true">Log reading</UiButton>
      </template>
      <template #filters>
        <UiFilterChip label="Date" :value="formatDate(day)" @clear="date = ''">
          <UiField v-model="date" label="Date" type="date" />
        </UiFilterChip>
      </template>
      <template #cell-at="{ row }">{{ formatTime(row.at) }}</template>
      <template #cell-tds="{ row }">{{ row.tds }} ppm</template>
      <template #cell-ph="{ row }">{{ row.ph ?? "-" }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="row.isOutOfRange ? 'danger' : 'ok'">{{ row.isOutOfRange ? "Out of range" : "OK" }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No water readings for this day" description="Log a TDS or pH reading to get started." />
      </template>
      <template #footer>
        <UiPagination v-if="water != null" v-model:page="waterPage" :total="water.total" :page-size="PAGE_SIZE" @clamp="clampWater" />
      </template>
    </UiDataTable>

    <UiDataTable
      title="Meter readings"
      :icon="IconClipboardText"
      :columns="meterColumns"
      :rows="meter?.items ?? []"
      :total="meter?.total"
      :is-loading="isMeterLoading"
      :error="meterError?.message"
      :row-key="(row) => row.id"
      @retry="reloadMeter"
    >
      <template #cell-at="{ row }">{{ formatTime(row.at) }}</template>
      <template #cell-liters="{ row }">{{ row.liters.toLocaleString() }} L</template>
      <template #empty>
        <UiEmptyState title="No meter readings for this day" />
      </template>
      <template #footer>
        <UiPagination v-if="meter != null" v-model:page="meterPage" :total="meter.total" :page-size="PAGE_SIZE" @clamp="clampMeter" />
      </template>
    </UiDataTable>

    <WaterReadingSheet v-model:open="isSheetOpen" @submit="reload" />
  </div>
</template>
