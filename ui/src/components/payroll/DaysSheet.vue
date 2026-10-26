<script setup lang="ts">
import type { TPayLine } from "@wrs/contract/payroll";

import { updatePayLineDays } from "@/services/payRun";

const line = defineModel<TPayLine>("line");

const { runId } = defineProps<{ runId: string }>();

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(updatePayLineDays, { inline: ["payroll.finalized", "validation"] });

const open = computed({
  get: () => line.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      line.value = undefined;
    }
  },
});

const daysWorked = ref<number>();

const canSubmit = computed(() => daysWorked.value != null && Number.isInteger(daysWorked.value) && daysWorked.value >= 0);

watch(open, (isOpen) => {
  if (isOpen) {
    daysWorked.value = line.value?.daysWorked;
  }
});

async function submit() {
  if (line.value == null || daysWorked.value == null || !canSubmit.value) {
    return;
  }

  await run({ id: runId, employeeId: line.value.employeeId, body: { daysWorked: daysWorked.value } });

  if (error.value != null) {
    return;
  }

  emit("submit");
  line.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Days worked">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ line?.employeeName }}</p>
      <UiNumberField v-model="daysWorked" label="Days worked" :min="0" required />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canSubmit" :loading="isRunning" @click="submit">Save days</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
