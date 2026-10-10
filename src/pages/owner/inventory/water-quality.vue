<script setup lang="ts">
import { IconPackage } from "@/components";
import { labTests as labTestsMock, waterReadings } from "@/mocks/waterQuality";
import { OWNER_TABS } from "@/types";
import type { TLabTest } from "@/types";

definePage({ meta: { title: "Water quality" } });

const { employeeName } = useEmployeeLookup();

const labTests = ref<TLabTest[]>([...labTestsMock]);

const sortedReadings = computed(() => [...waterReadings].sort((a, b) => a.at.localeCompare(b.at)));
const maxTds = computed(() => Math.max(...sortedReadings.value.map((reading) => reading.tds), 1));
const recentReadings = computed(() => [...sortedReadings.value].reverse());

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
];

const addOpen = ref(false);

function addLabTest(test: Omit<TLabTest, "id">) {
  labTests.value.push({ id: `lab-${labTests.value.length + 1}`, ...test });
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPanel title="Inventory" :icon="IconPackage" :tabs="OWNER_TABS.INVENTORY">
      <UiPanelSection title="TDS trend">
        <div class="px-5 pb-4">
          <div class="flex h-32 items-end gap-2">
            <div v-for="reading in sortedReadings" :key="reading.id" class="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <div
                class="w-full rounded-t bg-brand-500"
                :class="isTdsOutOfRange(reading.tds) ? '!bg-red-500' : ''"
                :style="{ height: `${Math.max((reading.tds / maxTds) * 100, 4)}%` }"
              ></div>
              <span class="text-xs text-zinc-500">{{ reading.tds }}</span>
            </div>
          </div>
          <p class="mt-2 text-sm text-zinc-500">ppm by reading, most recent {{ sortedReadings.length }} entries</p>
        </div>
      </UiPanelSection>

      <UiPanelSection title="Recent readings">
        <UiTable :columns="readingColumns" :rows="recentReadings" :row-key="(row) => row.id">
          <template #cell-at="{ row }">{{ formatDateTime(row.at) }}</template>
          <template #cell-by="{ row }">{{ employeeName(row.by) }}</template>
          <template #cell-tds="{ row }">
            <span :class="isTdsOutOfRange(row.tds) ? 'font-semibold text-red-700' : ''">{{ row.tds }} ppm</span>
          </template>
          <template #cell-ph="{ row }">{{ row.ph ?? "-" }}</template>
          <template #empty>
            <UiEmptyState title="No readings yet" />
          </template>
        </UiTable>
      </UiPanelSection>

      <UiPanelSection title="Lab tests">
        <template #actions>
          <UiButton @click="addOpen = true">Add lab test</UiButton>
        </template>
        <UiTable :columns="testColumns" :rows="labTests" :row-key="(row) => row.id">
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-nextDue="{ row }">{{ formatDate(row.nextDue) }}</template>
          <template #empty>
            <UiEmptyState title="No lab tests yet" description="Add the first lab test to start tracking due dates." />
          </template>
        </UiTable>
      </UiPanelSection>
    </UiPanel>

    <WaterLabTestSheet v-model:open="addOpen" @submit="addLabTest" />
  </div>
</template>
