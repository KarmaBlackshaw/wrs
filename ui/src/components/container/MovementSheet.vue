<script setup lang="ts">
import type { TContainerMovement, TContainerTypeCode, TMovementCreate } from "@wrs/contract/container";

import { createMovement } from "@/services/container";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [movement: TContainerMovement] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createMovement);

const MANUAL_TYPES: TMovementCreate["type"][] = ["damaged", "lost", "purchased", "retired"];
const manualTypeOptions = MOVEMENT_TYPE_OPTIONS.filter(({ value }) => MANUAL_TYPES.some((type) => type === value));

const movementType = ref<TMovementCreate["type"]>("damaged");
const containerType = ref<TContainerTypeCode>("round");
const qty = ref(1);
const isFull = ref(false);
const reason = ref("");

const canSubmit = computed(() => reason.value.trim() !== "" && qty.value >= 1);

watch(open, (isOpen) => {
  if (isOpen) {
    movementType.value = "damaged";
    containerType.value = "round";
    qty.value = 1;
    isFull.value = false;
    reason.value = "";
  }
});

async function submit() {
  if (!canSubmit.value) {
    return;
  }

  const movement = await run({
    type: movementType.value,
    containerType: containerType.value,
    qty: qty.value,
    full: isFull.value,
    reason: reason.value.trim(),
  });

  if (error.value != null || movement == null) {
    return;
  }

  toast.show("Container movement saved");
  emit("submit", movement);
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Record container movement">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="movementType" :options="manualTypeOptions" />
      <UiSelect v-model="containerType" label="Container type" :options="CONTAINER_TYPE_OPTIONS" />
      <UiStepper v-model="qty" label="Quantity" :min="1" />
      <UiCheckbox v-model="isFull" label="Containers were full" />
      <UiField v-model="reason" label="Reason" hint="Required" />
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <p v-if="error != null" role="alert" class="mr-auto text-sm text-red-700">{{ error.message }}</p>
        <UiButton :disabled="!canSubmit" :loading="isRunning" @click="submit">Save movement</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
