<script setup lang="ts">
import type { TTripDetail } from "@wrs/contract/trip";
import sumBy from "lodash/sumBy";

import { createShortage } from "@/services/shortage";

const trip = defineModel<TTripDetail>("trip");

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createShortage, { inline: ["validation", "conflict"] });

const cash = ref(0);
const containers = ref(0);
const hasSubmitted = ref(false);

const suggestedCash = computed(() => Math.max(0, -(trip.value?.cashVariance ?? 0)));
const suggestedContainers = computed(() => Math.max(0, -sumBy(trip.value?.lines, ({ varianceFull }) => varianceFull ?? 0)));
const isValid = computed(() => cash.value > 0 || containers.value > 0);

const isOpen = computed({
  get: () => trip.value != null,
  set: (value) => {
    if (!value) {
      trip.value = undefined;
    }
  },
});

watch(trip, (value) => {
  if (value != null) {
    cash.value = 0;
    containers.value = suggestedContainers.value;
    hasSubmitted.value = false;
  }
});

async function submit() {
  const current = trip.value;

  if (current == null || !isValid.value) {
    return;
  }

  hasSubmitted.value = true;
  await run({ source: "trip", refId: current.id, cash: cash.value, containers: containers.value });

  if (error.value != null) {
    return;
  }

  emit("submit");
  trip.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Record shortage">
    <div class="flex flex-col gap-4">
      <UiStepper v-model="containers" label="Containers short" :min="0" :max="999" />
      <UiMoneyPad v-model="cash" :suggestion="suggestedCash" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="hasSubmitted && error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!isValid" :loading="isRunning" @click="submit">Save shortage</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
