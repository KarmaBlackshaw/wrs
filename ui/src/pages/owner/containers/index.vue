<script setup lang="ts">
import { IconCube } from "@/components";
import { containerHoldings } from "@/mocks/containers";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Holdings" } });

const columns = [
  { key: "locationLabel", label: "Location" },
  { key: "type", label: "Type" },
  { key: "full", label: "Full", align: "right" as const },
  { key: "empty", label: "Empty", align: "right" as const },
];
</script>

<template>
  <UiDataTable
    title="Containers"
    :icon="IconCube"
    :tabs="OWNER_TABS.CONTAINERS"
    :columns="columns"
    :rows="containerHoldings"
    :row-key="(row) => `${row.location}-${row.type}`"
  >
    <template #empty>
      <UiEmptyState title="No holdings recorded" />
    </template>
  </UiDataTable>
</template>
