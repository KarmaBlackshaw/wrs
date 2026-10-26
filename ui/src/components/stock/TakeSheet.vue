<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { createStockEntry } from "@/services/stockEntry";

const consumable = defineModel<TConsumable>("consumable");

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createStockEntry, { inline: ["validation"] });

const stockTakePad = ref("");
const stockTakeReason = ref("");

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const stockTakeAmount = computed(() => Number(stockTakePad.value || "0"));
const isReasonMissing = computed(() => stockTakeReason.value.trim().length === 0);
const isCountMissing = computed(() => stockTakePad.value === "");
const isBlocked = computed(() => isReasonMissing.value || isCountMissing.value);

watch(open, (isOpen) => {
  if (isOpen && consumable.value != null) {
    stockTakePad.value = String(consumable.value.onHand);
    stockTakeReason.value = "";
  }
});

async function confirmStockTake() {
  if (consumable.value == null || isBlocked.value) {
    return;
  }

  await run({ kind: "stock_take", consumableId: consumable.value.id, counted: stockTakeAmount.value, reason: stockTakeReason.value.trim() });

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
      <p v-if="consumable" class="text-base font-medium text-zinc-900">{{ consumable.name }}</p>
      <p class="text-center text-2xl font-semibold tabular-nums">{{ stockTakeAmount }} {{ consumable?.unit }}</p>
      <UiButton v-if="consumable" variant="ghost" @click="stockTakePad = String(consumable.onHand)">Use current ({{ consumable.onHand }})</UiButton>
      <UiNumberPad v-model="stockTakePad" />
      <UiField v-model="stockTakeReason" label="Reason" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="isBlocked" :loading="isRunning" @click="confirmStockTake">Save stock-take</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
