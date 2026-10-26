<script setup lang="ts">
import type { TPrice, TProduct } from "@wrs/contract/product";

import { createPrice } from "@/services/product";

const product = defineModel<TProduct>("product");

const emit = defineEmits<{
  submit: [price: TPrice];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createPrice, { inline: ["validation"] });

const amount = ref<number>();
const effectiveFrom = ref(todayIso());

const isOpen = computed({
  get: () => product.value != null,
  set: (value) => {
    if (!value) {
      product.value = undefined;
    }
  },
});

watch(product, (current) => {
  if (current == null) {
    return;
  }

  amount.value = undefined;
  effectiveFrom.value = todayIso();
});

const blockReason = computed(() => {
  if (amount.value == null || amount.value <= 0) {
    return "Enter a price above zero.";
  }

  return effectiveFrom.value.length === 0 ? "Pick an effective date." : undefined;
});

async function submit() {
  if (product.value == null || amount.value == null) {
    return;
  }

  const price = await run({
    productId: product.value.id,
    body: { amount: amount.value, effectiveFrom: manilaMidnightIso(effectiveFrom.value) },
  });

  if (error.value != null || price == null) {
    return;
  }

  emit("submit", price);
  product.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Change price">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ product?.name }}</p>
      <UiMoneyField v-model="amount" label="New price (₱)" />
      <UiField v-model="effectiveFrom" label="Effective date" type="date" hint="Applies forward from this date; price history is kept." />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="price-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'price-block-reason' : undefined"
            @click="submit"
            >Save price</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
