<script setup lang="ts">
import type { TMaintenanceItem } from "@wrs/contract/maintenance";

import { createMaintenanceLog } from "@/services/maintenance";

const item = defineModel<TMaintenanceItem>("item");

const { latestMeterLiters } = defineProps<{
  latestMeterLiters?: number;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createMaintenanceLog, { inline: ["validation"] });

const open = computed({
  get: () => item.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      item.value = undefined;
    }
  },
});

const at = ref("");
const meterLiters = ref<number>();

const blockReason = computed(() => {
  if (at.value === "") {
    return "Enter the date and time.";
  }

  if (meterLiters.value == null || meterLiters.value < 0) {
    return "Enter a meter reading of zero or more.";
  }

  return undefined;
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  at.value = toManila(Date.now()).format("YYYY-MM-DDTHH:mm");
  meterLiters.value = latestMeterLiters;
});

async function submit() {
  if (item.value == null || meterLiters.value == null) {
    return;
  }

  await run({
    consumableId: item.value.consumableId,
    at: new Date(`${at.value}:00+08:00`).toISOString(),
    meterLiters: meterLiters.value,
  });

  if (error.value != null) {
    return;
  }

  emit("submit");
  item.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Log replacement">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ item?.name }}</p>
      <UiField v-model="at" label="Replaced at" type="datetime-local" />
      <UiNumberField v-model="meterLiters" label="Meter reading (liters)" :min="0" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="maintenance-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'maintenance-block-reason' : undefined"
            @click="submit"
            >Save replacement</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
