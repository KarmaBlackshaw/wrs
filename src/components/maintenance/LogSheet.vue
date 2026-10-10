<script setup lang="ts">
import type { TConsumable } from "@/types";

const item = defineModel<TConsumable>("item");

const { latestMeterLiters } = defineProps<{
  latestMeterLiters: number;
}>();

const emit = defineEmits<{
  submit: [item: TConsumable, meterLiters: number];
}>();

const toast = useToast();

const open = computed({
  get: () => item.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      item.value = undefined;
    }
  },
});

const meterReading = ref(0);

watch(open, (isOpen) => {
  if (isOpen) {
    meterReading.value = latestMeterLiters;
  }
});

function submitReplacement() {
  if (!item.value) {
    return;
  }

  emit("submit", item.value, meterReading.value);

  item.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Log replacement">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ item?.name }}</p>
      <UiStepper v-model="meterReading" label="Meter reading (liters)" :min="0" :max="999999" :step="10" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="submitReplacement">Save replacement</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
