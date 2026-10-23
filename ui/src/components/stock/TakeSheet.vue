<script setup lang="ts">
import type { TConsumable } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { consumable } = defineProps<{
  consumable?: TConsumable;
}>();

const emit = defineEmits<{ submit: [quantity: number] }>();

const toast = useToast();
const stockTakePad = ref("");
const stockTakeReason = ref("");

const stockTakeAmount = computed(() => Number(stockTakePad.value || "0"));

watch(open, (isOpen) => {
  if (isOpen) {
    stockTakePad.value = "";
    stockTakeReason.value = "";
  }
});

function confirmStockTake() {
  if (!consumable || !stockTakeReason.value.trim()) {
    return;
  }

  emit("submit", stockTakeAmount.value);
  open.value = false;
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
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!stockTakeReason.trim()" @click="confirmStockTake">Save stock-take</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
