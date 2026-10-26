<script setup lang="ts">
import { IconPackage } from "@/components";
import { consumables } from "@/mocks/consumables";
import type { TRowAction } from "@/types";

definePage({ meta: { title: "Stock" } });

const localConsumables = ref(consumables.map((consumable) => ({ ...consumable })));

const stockColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "name", label: "Consumable" },
  { key: "onHand", label: "On hand", align: "right" },
  { key: "status", label: "Status" },
];

const restockSheetOpen = ref(false);
const stockTakeSheetOpen = ref(false);
const selectedId = ref<string>();

const selected = computed(() => localConsumables.value.find((consumable) => consumable.id === selectedId.value));

function reorderTone(consumable: (typeof localConsumables.value)[number]) {
  if (consumable.onHand <= consumable.reorderLevel) {
    return "danger";
  }

  if (consumable.onHand <= consumable.reorderLevel * 1.5) {
    return "warn";
  }

  return null;
}

function reorderText(consumable: (typeof localConsumables.value)[number]) {
  const tone = reorderTone(consumable);

  if (tone === "danger") {
    return "Reorder now";
  }

  if (tone === "warn") {
    return "Reorder soon";
  }

  return null;
}

function openRestock(id: string) {
  selectedId.value = id;
  restockSheetOpen.value = true;
}

function openStockTake(id: string) {
  selectedId.value = id;
  stockTakeSheetOpen.value = true;
}

function confirmRestock(quantity: number) {
  if (!selected.value) {
    return;
  }

  selected.value.onHand += quantity;
}

function confirmStockTake(quantity: number) {
  if (!selected.value) {
    return;
  }

  selected.value.onHand = quantity;
}

function stockActions(consumable: (typeof localConsumables.value)[number]): TRowAction[] {
  return [
    { label: "Restock", onSelect: () => openRestock(consumable.id) },
    { label: "Stock-take", variant: "ghost", onSelect: () => openStockTake(consumable.id) },
  ];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable :row-actions="stockActions" title="Stock" :icon="IconPackage" :columns="stockColumns" :rows="localConsumables" :row-key="(row) => row.id">
      <template #cell-onHand="{ row }">{{ row.onHand }} {{ row.unit }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="reorderText(row)" :tone="reorderTone(row) ?? 'neutral'">{{ reorderText(row) }}</UiStatusPill>
      </template>
    </UiDataTable>

    <StockRestockSheet v-model:open="restockSheetOpen" :consumable="selected" @submit="confirmRestock" />
    <StockTakeSheet v-model:open="stockTakeSheetOpen" :consumable="selected" @submit="confirmStockTake" />
  </div>
</template>
