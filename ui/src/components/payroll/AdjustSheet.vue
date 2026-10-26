<script setup lang="ts">
import type { TPayLine } from "@wrs/contract/payroll";

import { addPayAdjustment } from "@/services/payRun";
import type { TOption } from "@/types";

const line = defineModel<TPayLine>("line");

const { runId } = defineProps<{ runId: string }>();

const emit = defineEmits<{ submit: [] }>();

type TDirection = "add" | "deduct";

const DIRECTION_OPTIONS: TOption<TDirection>[] = [
  { value: "add", label: "Add to pay" },
  { value: "deduct", label: "Deduct from pay" },
];

const toast = useToast();
const { run, isRunning, error } = useAction(addPayAdjustment, { inline: ["payroll.finalized", "validation"] });

const open = computed({
  get: () => line.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      line.value = undefined;
    }
  },
});

const direction = ref<TDirection>("add");
const amount = ref<number>();
const reason = ref("");

const canSubmit = computed(() => (amount.value ?? 0) > 0 && reason.value.trim().length > 0);

watch(open, (isOpen) => {
  if (isOpen) {
    direction.value = "add";
    amount.value = undefined;
    reason.value = "";
  }
});

async function submit() {
  if (line.value == null || amount.value == null || !canSubmit.value) {
    return;
  }

  const signed = direction.value === "deduct" ? -amount.value : amount.value;

  await run({ id: runId, body: { employeeId: line.value.employeeId, amount: signed, reason: reason.value.trim() } });

  if (error.value != null) {
    return;
  }

  emit("submit");
  line.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Adjust pay line">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ line?.employeeName }}</p>
      <UiSelect v-model="direction" label="Type" :options="DIRECTION_OPTIONS" />
      <UiMoneyField v-model="amount" label="Amount" />
      <UiField v-model="reason" label="Reason" maxlength="255" required />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canSubmit" :loading="isRunning" @click="submit">Save adjustment</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
