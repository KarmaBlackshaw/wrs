<script setup lang="ts">
import { IconCube } from "@/components";
import { containerMovements } from "@/mocks/containers";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Movement log" } });

const columns = [
  { key: "createdAt", label: "Date" },
  { key: "type", label: "Movement" },
  { key: "containerType", label: "Type" },
  { key: "qty", label: "Qty", align: "right" as const },
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "reason", label: "Reason" },
];

const movements = computed(() => [...containerMovements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

const movementSheetOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable title="Containers" :icon="IconCube" :tabs="OWNER_TABS.CONTAINERS" :columns="columns" :rows="movements" :row-key="(row) => row.id">
      <template #actions>
        <UiButton @click="movementSheetOpen = true">Record movement</UiButton>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #empty>
        <UiEmptyState title="No movements yet" />
      </template>
    </UiDataTable>

    <ContainerMovementSheet v-model:open="movementSheetOpen" />
  </div>
</template>
