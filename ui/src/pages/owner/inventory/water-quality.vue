<script setup lang="ts">
import { IconPackage } from "@/components";
import { listLabTests } from "@/services/labTest";
import { listWaterReadings } from "@/services/waterReading";
import { LAB_TEST_DUE_LABEL, LAB_TEST_DUE_TONE, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Water quality" } });

const PAGE_SIZE = 20;
const CHART_SIZE = 100;

const fileDownload = useFileDownload();

const from = useRouteQuery("from", toManila(Date.now()).subtract(29, "day").format("YYYY-MM-DD"), { mode: "push" });
const to = useRouteQuery("to", "", { mode: "push" });
const { page, clampTo } = usePageQuery("labTestsPage");

const {
  data: readings,
  isLoading: isLoadingReadings,
  error: readingsError,
  reload: reloadReadings,
} = useResource((signal) => listWaterReadings({ from: from.value || undefined, to: to.value || undefined, pageSize: CHART_SIZE }, signal), {
  watch: [from, to],
});

const {
  data: labTests,
  isLoading: isLoadingTests,
  error: testsError,
  reload: reloadTests,
} = useResource((signal) => listLabTests({ page: page.value, pageSize: PAGE_SIZE }, signal), { watch: [page] });

const readingItems = computed(() => readings.value?.items ?? []);
const chartReadings = computed(() => [...readingItems.value].reverse());
const maxTds = computed(() => Math.max(...chartReadings.value.map(({ tds }) => tds), 1));

const readingColumns = [
  { key: "at", label: "Date" },
  { key: "by", label: "By" },
  { key: "tds", label: "TDS", align: "right" as const },
  { key: "ph", label: "pH", align: "right" as const },
];

const testColumns = [
  { key: "type", label: "Type" },
  { key: "date", label: "Date" },
  { key: "result", label: "Result" },
  { key: "nextDue", label: "Next due" },
  { key: "file", label: "" },
];

const isAddOpen = ref(false);

const chartCaption = computed(() => {
  const total = readings.value?.total ?? 0;

  return total > chartReadings.value.length
    ? `ppm by reading, showing latest ${chartReadings.value.length} of ${total}`
    : `ppm by reading, ${total} entries in range`;
});

function barHeight(tds: number) {
  return `${Math.max((tds / maxTds.value) * 100, 4)}%`;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPanel title="Inventory" :icon="IconPackage" :tabs="OWNER_TABS.INVENTORY">
      <UiPanelSection title="TDS trend">
        <div class="flex flex-wrap gap-3 px-5 pb-3">
          <UiField v-model="from" label="From" type="date" />
          <UiField v-model="to" label="To" type="date" />
        </div>
        <UiEmptyState v-if="readingsError != null" title="Couldn't load" :description="readingsError.message">
          <template #action>
            <UiButton variant="secondary" @click="reloadReadings">Retry</UiButton>
          </template>
        </UiEmptyState>
        <div v-else-if="readings != null" class="px-5 pb-4">
          <div class="flex h-32 items-end gap-2">
            <div v-for="reading in chartReadings" :key="reading.id" class="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div class="w-full rounded-t" :class="reading.isOutOfRange ? 'bg-red-500' : 'bg-brand-500'" :style="{ height: barHeight(reading.tds) }"></div>
              <span class="text-xs text-zinc-500">{{ reading.tds }}</span>
            </div>
          </div>
          <p class="mt-2 text-sm text-zinc-500">{{ chartCaption }}</p>
        </div>
      </UiPanelSection>

      <UiPanelSection title="Recent readings">
        <UiDataTable
          bare
          :columns="readingColumns"
          :rows="readingItems"
          :is-loading="isLoadingReadings"
          :error="readingsError?.message"
          :row-key="(row) => row.id"
          @retry="reloadReadings"
        >
          <template #cell-at="{ row }">{{ formatDateTime(row.at) }}</template>
          <template #cell-by="{ row }">{{ row.loggedByName }}</template>
          <template #cell-tds="{ row }">
            <span :class="row.isOutOfRange ? 'font-semibold text-red-700' : ''">{{ row.tds }} ppm</span>
          </template>
          <template #cell-ph="{ row }">{{ row.ph ?? "-" }}</template>
          <template #empty>
            <UiEmptyState title="No readings in this range" />
          </template>
        </UiDataTable>
      </UiPanelSection>

      <UiPanelSection title="Lab tests">
        <template #actions>
          <UiButton @click="isAddOpen = true">Add lab test</UiButton>
        </template>
        <UiDataTable
          bare
          :columns="testColumns"
          :rows="labTests?.items ?? []"
          :total="labTests?.total"
          :is-loading="isLoadingTests"
          :error="testsError?.message"
          :row-key="(row) => row.id"
          @retry="reloadTests"
        >
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-nextDue="{ row }">
            {{ formatDate(row.nextDue) }}
            <UiStatusPill v-if="row.dueStatus != null" :tone="LAB_TEST_DUE_TONE[row.dueStatus]">{{ LAB_TEST_DUE_LABEL[row.dueStatus] }}</UiStatusPill>
          </template>
          <template #cell-file="{ row }">
            <UiButton variant="ghost" size="sm" @click="fileDownload.open(row.fileId)">View lab result</UiButton>
          </template>
          <template #empty>
            <UiEmptyState title="No lab tests yet" description="Add the first lab test to start tracking due dates." />
          </template>
          <template #footer>
            <UiPagination v-if="labTests != null" v-model:page="page" :total="labTests.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
          </template>
        </UiDataTable>
      </UiPanelSection>
    </UiPanel>

    <WaterLabTestSheet v-model:open="isAddOpen" @submit="reloadTests" />
  </div>
</template>
