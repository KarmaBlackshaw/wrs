<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { IconPackage } from "@/components";
import { listConsumables } from "@/services/consumable";
import { OWNER_TABS, type TRowAction } from "@/types";

definePage({ meta: { title: "Consumables" } });

const isWide = useMediaQuery("(min-width: 640px)");

const columns = computed(() =>
  isWide.value
    ? [
        { key: "name", label: "Consumable" },
        { key: "kind", label: "Kind" },
        { key: "onHand", label: "On hand", align: "right" as const },
        { key: "status", label: "Status" },
      ]
    : [{ key: "name", label: "Consumable" }]
);

const { data, isLoading, error, reload } = useResource((signal) => listConsumables(signal));

const isAddOpen = ref(false);
const editing = ref<TConsumable>();
const restocking = ref<TConsumable>();
const usageSheetConsumable = ref<TConsumable>();
const stockTakeConsumable = ref<TConsumable>();
const historyConsumable = ref<TConsumable>();

const isFormOpen = computed({
  get: () => isAddOpen.value || editing.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      isAddOpen.value = false;
      editing.value = undefined;
    }
  },
});

function consumableActions(consumable: TConsumable): TRowAction[] {
  return [
    { label: "Edit", onSelect: () => (editing.value = consumable) },
    { label: "Restock", onSelect: () => (restocking.value = consumable) },
    { label: "Usage", onSelect: () => (usageSheetConsumable.value = consumable) },
    { label: "Stock-take", onSelect: () => (stockTakeConsumable.value = consumable) },
    { label: "History", onSelect: () => (historyConsumable.value = consumable) },
  ];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="consumableActions"
      title="Inventory"
      :icon="IconPackage"
      :tabs="OWNER_TABS.INVENTORY"
      :columns="columns"
      :rows="data ?? []"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.id"
      @retry="reload"
    >
      <template #actions>
        <UiButton @click="isAddOpen = true">Add consumable</UiButton>
      </template>
      <template #cell-name="{ row }">
        <span class="block">{{ row.name }}</span>
        <span v-if="!isWide" class="mt-1 flex items-center gap-2 text-sm text-zinc-500">
          {{ row.onHand }} {{ row.unit }}
          <UiStatusPill :tone="STOCK_STATUS_TONE[row.stockStatus]">{{ STOCK_STATUS_LABEL[row.stockStatus] }}</UiStatusPill>
        </span>
      </template>
      <template #cell-kind="{ row }">{{ CONSUMABLE_KIND_LABEL[row.kind] }}</template>
      <template #cell-onHand="{ row }">{{ row.onHand }} {{ row.unit }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="STOCK_STATUS_TONE[row.stockStatus]">{{ STOCK_STATUS_LABEL[row.stockStatus] }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No consumables yet" />
      </template>
    </UiDataTable>

    <ConsumableAddSheet v-model:open="isFormOpen" :consumable="editing" @submit="reload" />
    <ConsumableEntryHistorySheet v-model:consumable="historyConsumable" />
    <StockRestockSheet v-model:consumable="restocking" @submit="reload" />
    <ConsumableUsageSheet v-model:consumable="usageSheetConsumable" @submit="reload" />
    <ConsumableStockTakeSheet v-model:consumable="stockTakeConsumable" @submit="reload" />
  </div>
</template>
