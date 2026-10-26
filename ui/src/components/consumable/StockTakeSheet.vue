<script setup lang="ts">
import type { TConsumable } from "@/types";

const consumable = defineModel<TConsumable>("consumable");

const emit = defineEmits<{
  submit: [consumable: TConsumable, countedQty: number];
}>();

const toast = useToast();

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const countedQty = ref(0);

watch(open, (isOpen) => {
  if (isOpen && consumable.value) {
    countedQty.value = consumable.value.onHand;
  }
});

function submitStockTake() {
  if (!consumable.value) {
    return;
  }

  emit("submit", consumable.value, countedQty.value);

  consumable.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Stock-take">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ consumable?.name }}, on hand: {{ consumable?.onHand }}</p>
      <UiStepper v-model="countedQty" label="Counted quantity" :min="0" :max="99999" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="submitStockTake">Save count</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
