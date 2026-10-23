<script setup lang="ts">
import type { TPrice, TProduct } from "@/types";

const product = defineModel<TProduct>("product");

defineProps<{
  prices: TPrice[];
}>();

const open = computed({
  get: () => product.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      product.value = undefined;
    }
  },
});
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Price history">
    <p class="text-sm text-zinc-500">{{ product?.name }}</p>
    <ul class="mt-2 flex flex-col gap-1 text-sm text-zinc-600">
      <li v-for="price in prices" :key="price.effectiveFrom" class="flex justify-between">
        <span>From {{ formatDate(price.effectiveFrom) }}</span>
        <UiMoneyText :centavos="price.amount" size="sm" tone="muted" />
      </li>
    </ul>
  </UiBottomSheet>
</template>
