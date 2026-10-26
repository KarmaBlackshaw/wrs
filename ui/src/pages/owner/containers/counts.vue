<script setup lang="ts">
import { IconCube } from "@/components";
import { containerCounts } from "@/mocks/containers";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Count variances" } });

const columns = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "full", label: "Full", align: "right" as const },
  { key: "empty", label: "Empty", align: "right" as const },
  { key: "expected", label: "Expected", align: "right" as const },
  { key: "variance", label: "Variance", align: "right" as const },
];

const counts = computed(() =>
  containerCounts.map((count) => ({ ...count, variance: count.full + count.empty - count.expected })).sort((a, b) => b.date.localeCompare(a.date))
);
</script>

<template>
  <UiDataTable title="Containers" :icon="IconCube" :tabs="OWNER_TABS.CONTAINERS" :columns="columns" :rows="counts" :row-key="(row) => row.id">
    <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
    <template #cell-variance="{ row }">
      <UiStatusPill :tone="row.variance === 0 ? 'ok' : 'danger'">{{ row.variance }}</UiStatusPill>
    </template>
    <template #empty>
      <UiEmptyState title="No counts recorded" />
    </template>
  </UiDataTable>
</template>
