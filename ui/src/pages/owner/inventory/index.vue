<script setup lang="ts">
import type { TProduct } from "@wrs/contract/product";

import { IconPackage } from "@/components";
import { listProducts } from "@/services/product";
import { type TRowAction, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Products & prices" } });

const productStore = useProductStore();

const { data, isLoading, error, reload } = useResource((signal) => listProducts({ includeInactive: "yes" }, signal));

const columns = [
  { key: "name", label: "Product" },
  { key: "kind", label: "Kind" },
  { key: "containerType", label: "Container" },
  { key: "price", label: "Price", align: "right" as const },
];

const isAddOpen = ref(false);
const editProduct = ref<TProduct>();
const priceSheetProduct = ref<TProduct>();
const historyProduct = ref<TProduct>();

async function refresh() {
  await Promise.all([reload(), productStore.refresh()]);
}

function productActions(product: TProduct): TRowAction[] {
  return [
    { label: "Edit", onSelect: () => (editProduct.value = product) },
    { label: "History", onSelect: () => (historyProduct.value = product) },
    { label: "Change price", onSelect: () => (priceSheetProduct.value = product) },
  ];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="productActions"
      title="Inventory"
      :icon="IconPackage"
      :tabs="OWNER_TABS.INVENTORY"
      :columns="columns"
      :rows="data ?? []"
      :row-key="(row) => row.id"
      :row-label="(row) => row.name"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #actions>
        <UiButton @click="isAddOpen = true">Add product</UiButton>
      </template>
      <template #cell-kind="{ row }">
        <div class="flex items-center gap-2">
          <UiStatusPill tone="neutral">{{ PRODUCT_KIND_LABEL[row.kind] }}</UiStatusPill>
          <UiStatusPill v-if="!row.active" tone="warn">Inactive</UiStatusPill>
        </div>
      </template>
      <template #cell-containerType="{ row }">
        <UiStatusPill v-if="row.containerType" tone="info">{{ CONTAINER_TYPE_LABEL[row.containerType] }}</UiStatusPill>
        <span v-else class="text-zinc-400">-</span>
      </template>
      <template #cell-price="{ row }">
        <div class="flex flex-col items-end gap-1">
          <UiMoneyText v-if="row.currentPrice != null" :centavos="row.currentPrice" />
          <span v-else class="text-zinc-400">-</span>
          <span v-for="upcoming in row.upcomingPrices" :key="upcoming.effectiveFrom" class="text-xs text-zinc-500">
            <UiMoneyText :centavos="upcoming.amount" /> from {{ formatDate(upcoming.effectiveFrom) }}
          </span>
        </div>
      </template>
      <template #empty>
        <UiEmptyState title="No products yet" description="Add your first product to start tracking prices." />
      </template>
    </UiDataTable>

    <ProductAddSheet v-model:open="isAddOpen" @submit="refresh" />
    <ProductEditSheet v-model:product="editProduct" @submit="refresh" />
    <ProductPriceSheet v-model:product="priceSheetProduct" @submit="refresh" />
    <ProductHistorySheet v-model:product="historyProduct" />
  </div>
</template>
