<script setup lang="ts">
import type { TPayFrequency, TPayRun } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [run: Omit<TPayRun, "id">];
}>();

const toast = useToast();

const newFrequency = ref<TPayFrequency>("semi-monthly");
const newPeriodStart = ref(todayIso());
const newPeriodEnd = ref(todayIso());

const canCreateRun = computed(() => newPeriodStart.value.length > 0 && newPeriodEnd.value.length > 0 && newPeriodStart.value <= newPeriodEnd.value);

function submit() {
  if (!canCreateRun.value) {
    return;
  }

  emit("submit", {
    frequency: newFrequency.value,
    periodStart: newPeriodStart.value,
    periodEnd: newPeriodEnd.value,
    status: "draft",
  });

  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="New payroll run">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="newFrequency" label="Frequency" :options="PAY_FREQUENCY_OPTIONS" />
      <UiField v-model="newPeriodStart" label="Period start" type="date" />
      <UiField v-model="newPeriodEnd" label="Period end" type="date" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canCreateRun" @click="submit">Create run</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
