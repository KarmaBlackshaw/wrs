<script setup lang="ts">
import { IconPackage } from "@/components";
import { consumables as consumablesMock, productUsages as productUsagesMock, stockEntries as stockEntriesMock } from "@/mocks/consumables";
import type { TConsumable, TProductUsage, TRowAction, TStockEntry } from "@/types";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Consumables" } });

const consumables = ref<TConsumable[]>([...consumablesMock]);
const productUsages = ref<TProductUsage[]>([...productUsagesMock]);
const stockEntries = ref<TStockEntry[]>([...stockEntriesMock]);

const columns = [
  { key: "name", label: "Consumable" },
  { key: "kind", label: "Kind" },
  { key: "onHand", label: "On hand", align: "right" as const },
  { key: "status", label: "Status" },
];

const usageSheetConsumable = ref<TConsumable>();
const stockTakeConsumable = ref<TConsumable>();

function saveUsages(consumableId: string, usages: TProductUsage[]) {
  productUsages.value = productUsages.value.filter((usage) => usage.consumableId !== consumableId);
  productUsages.value.push(...usages);
}

function saveStockTake(consumable: TConsumable, countedQty: number) {
  const delta = countedQty - consumable.onHand;

  consumable.onHand = countedQty;

  stockEntries.value.push({
    id: `stock-${stockEntries.value.length + 1}`,
    consumableId: consumable.id,
    qty: delta,
    reason: "Stock-take adjustment",
    createdAt: new Date().toISOString(),
  });
}

function consumableActions(consumable: TConsumable): TRowAction[] {
  return [
    { label: "Usage", onSelect: () => (usageSheetConsumable.value = consumable) },
    { label: "Stock-take", onSelect: () => (stockTakeConsumable.value = consumable) },
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
      :rows="consumables"
      :row-key="(row) => row.id"
    >
      <template #cell-onHand="{ row }">{{ row.onHand }} {{ row.unit }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="row.onHand <= row.reorderLevel ? 'warn' : 'ok'">
          {{ row.onHand <= row.reorderLevel ? "Reorder" : "OK" }}
        </UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No consumables yet" />
      </template>
    </UiDataTable>

    <ConsumableUsageSheet v-model:consumable="usageSheetConsumable" :usages="productUsages" @submit="saveUsages" />
    <ConsumableStockTakeSheet v-model:consumable="stockTakeConsumable" @submit="saveStockTake" />
  </div>
</template>
