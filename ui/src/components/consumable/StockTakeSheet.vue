<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { createStockEntry } from "@/services/stockEntry";

const consumable = defineModel<TConsumable>("consumable");

const emit = defineEmits<{
  submit: [];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createStockEntry, { inline: ["validation"] });

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const countedQty = ref<number>();
const reason = ref("");

const blockReason = computed(() => {
  if (countedQty.value == null || countedQty.value < 0) {
    return "Enter the counted quantity.";
  }

  if (reason.value.trim().length === 0) {
    return "Enter a reason for the count.";
  }

  return undefined;
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  countedQty.value = consumable.value?.onHand;
  reason.value = "";
});

async function submit() {
  if (consumable.value == null || countedQty.value == null) {
    return;
  }

  await run({ kind: "stock_take", consumableId: consumable.value.id, counted: countedQty.value, reason: reason.value.trim() });

  if (error.value != null) {
    return;
  }

  emit("submit");
  consumable.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Stock-take">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ consumable?.name }}, on hand: {{ consumable?.onHand }}</p>
      <UiNumberField v-model="countedQty" label="Counted quantity" :min="0" :is-integer="false" />
      <UiTextarea v-model="reason" label="Reason" :rows="2" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="stock-take-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'stock-take-block-reason' : undefined"
            @click="submit"
            >Save count</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
