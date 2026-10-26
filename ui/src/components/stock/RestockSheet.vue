<script setup lang="ts">
import type { TConsumable } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { consumable } = defineProps<{
  consumable?: TConsumable;
}>();

const emit = defineEmits<{ submit: [quantity: number] }>();

const toast = useToast();
const restockPad = ref("");

const restockAmount = computed(() => Number(restockPad.value || "0"));
const suggestedTopUp = computed(() => (consumable ? Math.max(0, consumable.reorderLevel - consumable.onHand) : 0));

watch(open, (isOpen) => {
  if (isOpen) {
    restockPad.value = "";
  }
});

function confirmRestock() {
  if (!consumable || restockAmount.value <= 0) {
    return;
  }

  emit("submit", restockAmount.value);
  open.value = false;
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
      <div class="flex justify-end gap-2">
        <UiButton :disabled="restockAmount <= 0" @click="confirmRestock">Save restock</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
