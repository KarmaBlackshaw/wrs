<script setup lang="ts">
import { createMeterReading } from "@/services/meterReading";
import { createWaterReading } from "@/services/waterReading";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [];
}>();

const toast = useToast();
const { run: runWater, isRunning: isSavingWater, error: waterError } = useAction(createWaterReading, { inline: ["validation"] });
const { run: runMeter, isRunning: isSavingMeter, error: meterError } = useAction(createMeterReading, { inline: ["meter.below_last", "validation"] });

const tdsInput = ref("");
const ph = ref<number>();
const meterInput = ref("");

const isRunning = computed(() => isSavingWater.value || isSavingMeter.value);
const error = computed(() => waterError.value ?? meterError.value);
const hasWater = computed(() => tdsInput.value.trim() !== "");
const hasMeter = computed(() => meterInput.value.trim() !== "");

const blockReason = computed(() => {
  if (!hasWater.value && !hasMeter.value) {
    return "Enter a TDS or meter reading.";
  }

  if (!hasWater.value && ph.value != null) {
    return "Enter the TDS that goes with the pH.";
  }

  if (ph.value != null && (ph.value < 0 || ph.value > 14)) {
    return "pH must be between 0 and 14.";
  }

  return undefined;
});

watch(open, (isOpen) => {
  if (isOpen) {
    tdsInput.value = "";
    ph.value = undefined;
    meterInput.value = "";
  }
});

async function submit() {
  if (hasWater.value) {
    const water = await runWater({ tds: Number(tdsInput.value), ph: ph.value });

    if (water == null || waterError.value != null) {
      return;
    }

    tdsInput.value = "";
    ph.value = undefined;
  }

  if (hasMeter.value) {
    const meter = await runMeter({ liters: Math.round(Number(meterInput.value)) });

    if (meter == null || meterError.value != null) {
      return;
    }
  }

  emit("submit");
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Log reading">
    <div class="flex flex-col gap-4">
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">TDS (ppm)</p>
        <UiNumberPad v-model="tdsInput" />
      </div>
      <UiNumberField v-model="ph" label="pH (optional)" :min="0" :max="14" :step="0.1" :is-integer="false" />
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">Meter liters (optional)</p>
        <UiNumberPad v-model="meterInput" />
      </div>
    </div>
    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="reading-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'reading-block-reason' : undefined"
            @click="submit"
            >Save reading</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
