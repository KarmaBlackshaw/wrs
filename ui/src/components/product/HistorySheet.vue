<script setup lang="ts">
import type { TProduct } from "@wrs/contract/product";

import { listProductPrices } from "@/services/product";

const product = defineModel<TProduct>("product");

const {
  data: prices,
  isLoading,
  error,
  reload,
} = useResource(async (signal) => (product.value != null ? listProductPrices(product.value.id, signal) : []), { watch: product });

const isOpen = computed({
  get: () => product.value != null,
  set: (value) => {
    if (!value) {
      product.value = undefined;
    }
  },
});

const columns = [
  { key: "effectiveFrom", label: "Effective" },
  { key: "amount", label: "Price", align: "right" as const },
];

function isScheduled(effectiveFrom: string) {
  return new Date(effectiveFrom).getTime() > Date.now();
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Price history">
    <p class="mb-2 text-sm text-zinc-500">{{ product?.name }}</p>
    <UiDataTable bare :columns :rows="prices ?? []" :row-key="(row) => row.effectiveFrom" :is-loading :error="error?.message" @retry="reload">
      <template #cell-effectiveFrom="{ row }">
        <div class="flex items-center gap-2">
          <span class="text-zinc-700">{{ formatDate(row.effectiveFrom) }}</span>
          <UiStatusPill v-if="isScheduled(row.effectiveFrom)" tone="info">Scheduled</UiStatusPill>
        </div>
      </template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.amount" size="sm" />
      </template>
      <template #empty>
        <UiEmptyState title="No prices yet" />
      </template>
    </UiDataTable>
  </UiBottomSheet>
</template>
