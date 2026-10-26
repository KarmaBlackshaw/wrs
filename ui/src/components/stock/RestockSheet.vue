<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { createStockEntry } from "@/services/stockEntry";

const consumable = defineModel<TConsumable>("consumable");

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createStockEntry, { inline: ["validation"] });

const restockPad = ref("");

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const restockAmount = computed(() => Number(restockPad.value || "0"));
const suggestedTopUp = computed(() => (consumable.value ? Math.max(0, consumable.value.reorderLevel - consumable.value.onHand) : 0));

watch(open, (isOpen) => {
  if (isOpen) {
    restockPad.value = "";
  }
});

async function confirmRestock() {
  if (consumable.value == null || restockAmount.value <= 0) {
    return;
  }

  await run({ kind: "restock", consumableId: consumable.value.id, qty: restockAmount.value });

  if (error.value != null) {
    return;
  }

  emit("submit");
  consumable.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Restock">
    <div class="flex flex-col gap-4">
      <p v-if="consumable" class="text-base font-medium text-zinc-900">{{ consumable.name }}</p>
      <p class="text-center text-2xl font-semibold tabular-nums">{{ restockAmount }} {{ consumable?.unit }}</p>
      <UiButton v-if="suggestedTopUp > 0" variant="ghost" @click="restockPad = String(suggestedTopUp)"
        >Use {{ suggestedTopUp }} (top up to reorder level)</UiButton
      >
      <UiNumberPad v-model="restockPad" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="restockAmount <= 0" :loading="isRunning" @click="confirmRestock">Save restock</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
