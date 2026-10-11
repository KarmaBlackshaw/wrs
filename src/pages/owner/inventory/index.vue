<script setup lang="ts">
import { IconPackage } from "@/components";
import { products as productsMock, prices as pricesMock } from "@/mocks/products";
import { type TPrice, type TProduct, type TRowAction, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Products & prices" } });

const products = ref<TProduct[]>([...productsMock]);
const prices = ref<TPrice[]>([...pricesMock]);

const columns = [
  { key: "name", label: "Product" },
  { key: "kind", label: "Kind" },
  { key: "containerType", label: "Container" },
  { key: "price", label: "Price", align: "right" as const },
];

const pricesByProduct = computed(() => {
  const map = new Map<string, TPrice[]>();

  for (const price of prices.value) {
    const list = map.get(price.productId) ?? [];
    list.push(price);
    map.set(price.productId, list);
  }

  for (const list of map.values()) {
    list.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  }

  return map;
});

function currentAmount(productId: string) {
  return latestEffective(pricesByProduct.value.get(productId) ?? [])?.amount ?? 0;
}

const historyProduct = ref<TProduct>();

const historyPrices = computed(() => pricesByProduct.value.get(historyProduct.value?.id ?? "") ?? []);

const addOpen = ref(false);
const priceSheetProduct = ref<TProduct>();

function addProduct({ product, price }: { product: Omit<TProduct, "id">; price: Omit<TPrice, "productId"> }) {
  const id = `prod-${products.value.length + 1}`;

  products.value.push({ id, ...product });
  prices.value.push({ productId: id, ...price });
}

function productActions(product: TProduct): TRowAction[] {
  return [
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
      :rows="products"
      :row-key="(row) => row.id"
    >
      <template #actions>
        <UiButton @click="addOpen = true">Add product</UiButton>
      </template>
      <template #cell-kind="{ row }">
        <div class="flex items-center gap-2">
          <UiStatusPill tone="neutral">{{ row.kind }}</UiStatusPill>
          <UiStatusPill v-if="!row.active" tone="warn">Inactive</UiStatusPill>
        </div>
      </template>
      <template #cell-containerType="{ row }">
        <UiStatusPill v-if="row.containerType" tone="info">{{ row.containerType }}</UiStatusPill>
        <span v-else class="text-zinc-400">-</span>
      </template>
      <template #cell-price="{ row }"><UiMoneyText :centavos="currentAmount(row.id)" /></template>
      <template #empty>
        <UiEmptyState title="No products yet" description="Add your first product to start tracking prices." />
      </template>
    </UiDataTable>

    <ProductAddSheet v-model:open="addOpen" @submit="addProduct" />
    <ProductPriceSheet v-model:product="priceSheetProduct" @submit="prices.push($event)" />
    <ProductHistorySheet v-model:product="historyProduct" :prices="historyPrices" />
  </div>
</template>
