<script setup lang="ts">
import type { TPrice, TProduct } from "@/types";

const product = defineModel<TProduct>("product");

const emit = defineEmits<{
  submit: [value: TPrice];
}>();

const toast = useToast();

const open = computed({
  get: () => product.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      product.value = undefined;
    }
  },
});

const priceAmount = ref("");
const priceEffectiveFrom = ref(todayIso());

watch(open, (isOpen) => {
  if (isOpen) {
    priceAmount.value = "";
    priceEffectiveFrom.value = todayIso();
  }
});

const canSubmitPrice = computed(() => Number(priceAmount.value) > 0 && priceEffectiveFrom.value.length > 0);

function submitPriceChange() {
  if (!product.value || !canSubmitPrice.value) {
    return;
  }

  emit("submit", {
    productId: product.value.id,
    amount: Math.round(Number(priceAmount.value) * 100),
    effectiveFrom: priceEffectiveFrom.value,
  });

  product.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Change price">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ product?.name }}</p>
      <UiField v-model="priceAmount" label="New price (₱)" type="number" inputmode="decimal" />
      <UiField v-model="priceEffectiveFrom" label="Effective date" type="date" hint="Applies forward from this date; price history is kept." />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmitPrice" @click="submitPriceChange">Save price</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
