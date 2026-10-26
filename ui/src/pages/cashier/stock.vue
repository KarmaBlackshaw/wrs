<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { IconPackage } from "@/components";
import { listConsumables } from "@/services/consumable";
import type { TRowAction } from "@/types";

definePage({ meta: { title: "Stock" } });

const { data: consumables, isLoading, error, reload } = useResource(listConsumables);

const isWide = useMediaQuery("(min-width: 640px)");

const stockColumns = computed(() =>
  isWide.value
    ? [
        { key: "name", label: "Consumable" },
        { key: "onHand", label: "On hand", align: "right" as const },
        { key: "status", label: "Status" },
      ]
    : [{ key: "name", label: "Consumable" }]
);

const restocking = ref<TConsumable>();
const counting = ref<TConsumable>();

function stockActions(consumable: TConsumable): TRowAction[] {
  return [
    { label: "Restock", onSelect: () => (restocking.value = consumable) },
    { label: "Stock-take", variant: "ghost", onSelect: () => (counting.value = consumable) },
  ];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="stockActions"
      title="Stock"
      :icon="IconPackage"
      :columns="stockColumns"
      :rows="consumables ?? []"
      :row-key="(row) => row.id"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #cell-name="{ row }">
        <span class="block">{{ row.name }}</span>
        <span v-if="!isWide" class="mt-1 flex items-center gap-2 text-sm text-zinc-500">
          {{ row.onHand }} {{ row.unit }}
          <UiStatusPill v-if="row.stockStatus !== 'ok'" :tone="STOCK_STATUS_TONE[row.stockStatus]">{{ STOCK_STATUS_LABEL[row.stockStatus] }}</UiStatusPill>
        </span>
      </template>
      <template #cell-onHand="{ row }">{{ row.onHand }} {{ row.unit }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="row.stockStatus !== 'ok'" :tone="STOCK_STATUS_TONE[row.stockStatus]">{{ STOCK_STATUS_LABEL[row.stockStatus] }}</UiStatusPill>
      </template>
      <template #empty>No consumables yet.</template>
    </UiDataTable>

    <StockRestockSheet v-model:consumable="restocking" @submit="reload" />
    <StockTakeSheet v-model:consumable="counting" @submit="reload" />
  </div>
</template>
