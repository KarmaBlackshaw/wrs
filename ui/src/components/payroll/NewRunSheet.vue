<script setup lang="ts">
import type { TPayFrequency } from "@wrs/contract/employee";
import type { TPayRun } from "@wrs/contract/payroll";

import { createPayRun } from "@/services/payRun";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [run: TPayRun] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createPayRun, { inline: ["payroll.overlap", "validation"] });

const DATE_FORMAT = "YYYY-MM-DD";

function defaultPeriod(frequency: TPayFrequency) {
  const today = toManila(Date.now());

  if (frequency === "weekly") {
    const monday = today.subtract((today.day() + 6) % 7, "day");

    return { start: monday.format(DATE_FORMAT), end: monday.add(6, "day").format(DATE_FORMAT) };
  }

  if (frequency === "semi_monthly") {
    const isFirstHalf = today.date() <= 15;

    return {
      start: today.date(isFirstHalf ? 1 : 16).format(DATE_FORMAT),
      end: (isFirstHalf ? today.date(15) : today.endOf("month")).format(DATE_FORMAT),
    };
  }

  if (frequency === "monthly") {
    return { start: today.startOf("month").format(DATE_FORMAT), end: today.endOf("month").format(DATE_FORMAT) };
  }

  return { start: today.format(DATE_FORMAT), end: today.format(DATE_FORMAT) };
}

const frequency = ref<TPayFrequency>("semi_monthly");
const periodStart = ref("");
const periodEnd = ref("");
const isPeriodEdited = ref(false);

function seedPeriod() {
  const { start, end } = defaultPeriod(frequency.value);
  periodStart.value = start;
  periodEnd.value = end;
}

seedPeriod();

watch(frequency, () => {
  if (!isPeriodEdited.value) {
    seedPeriod();
  }
});

watch([periodStart, periodEnd], ([start, end]) => {
  const expected = defaultPeriod(frequency.value);
  isPeriodEdited.value = start !== expected.start || end !== expected.end;
});

const canCreateRun = computed(() => periodStart.value.length > 0 && periodEnd.value.length > 0 && periodStart.value <= periodEnd.value);

watch(open, (isOpen) => {
  if (isOpen) {
    frequency.value = "semi_monthly";
    isPeriodEdited.value = false;
    seedPeriod();
  }
});

async function submit() {
  if (!canCreateRun.value) {
    return;
  }

  const created = await run({ frequency: frequency.value, periodStart: periodStart.value, periodEnd: periodEnd.value });

  if (error.value != null || created == null) {
    return;
  }

  emit("submit", created);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="New payroll run">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="frequency" label="Frequency" :options="PAY_FREQUENCY_OPTIONS" />
      <UiField v-model="periodStart" label="Period start" type="date" />
      <UiField v-model="periodEnd" label="Period end" type="date" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canCreateRun" :loading="isRunning" @click="submit">Create run</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
