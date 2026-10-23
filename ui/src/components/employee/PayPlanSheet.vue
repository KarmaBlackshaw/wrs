<script setup lang="ts">
import type { TPayFrequency, TPayPlan, TRateBasis } from "@wrs/contract/employee";

import { DEDUCTION_CAP_PCT } from "@wrs/contract/rules/employeeLimits";

import { createPayPlan } from "@/services/employee";

const open = defineModel<boolean>("open", { default: false });

const { employeeId, currentPlan } = defineProps<{
  employeeId: string;
  currentPlan?: TPayPlan;
}>();

const emit = defineEmits<{
  submit: [plan: TPayPlan];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createPayPlan, { inline: ["validation"] });

const frequency = ref<TPayFrequency>("monthly");
const rateBasis = ref<TRateBasis>("per_period");
const baseRate = ref<number>();
const quota = ref(0);
const incentive = ref<number>();
const deductionCapPct = ref<number>();
const restWeekday = ref<number | null>(null);
const ptoDaysOverride = ref<number>();
const maxLoanAmountOverride = ref<number>();
const effectiveFrom = ref(todayIso());

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  frequency.value = currentPlan?.frequency ?? "monthly";
  rateBasis.value = currentPlan?.rateBasis ?? "per_period";
  baseRate.value = currentPlan?.baseRate;
  quota.value = currentPlan?.quota ?? 0;
  incentive.value = currentPlan?.incentivePerContainer ?? undefined;
  deductionCapPct.value = currentPlan?.deductionCapPct ?? undefined;
  restWeekday.value = currentPlan?.restWeekday ?? null;
  ptoDaysOverride.value = currentPlan?.ptoDaysOverride ?? undefined;
  maxLoanAmountOverride.value = currentPlan?.maxLoanAmountOverride ?? undefined;
  const today = todayIso();
  effectiveFrom.value = minEffectiveFrom.value != null && minEffectiveFrom.value > today ? minEffectiveFrom.value : today;
});

const minEffectiveFrom = computed(() => (currentPlan ? toManila(currentPlan.effectiveFrom).add(1, "day").format("YYYY-MM-DD") : undefined));

const effectiveFromError = computed(() =>
  minEffectiveFrom.value != null && effectiveFrom.value < minEffectiveFrom.value ? `Must be on or after ${formatDate(minEffectiveFrom.value)}.` : undefined
);

const deductionCapError = computed(() =>
  deductionCapPct.value != null && (deductionCapPct.value < DEDUCTION_CAP_PCT.min || deductionCapPct.value > DEDUCTION_CAP_PCT.max)
    ? `Enter ${DEDUCTION_CAP_PCT.min} to ${DEDUCTION_CAP_PCT.max}.`
    : undefined
);

const blockReason = computed(() => {
  if (baseRate.value == null) {
    return "Enter the base rate to save.";
  }

  if (deductionCapError.value != null) {
    return "Fix the deduction cap to save.";
  }

  if (effectiveFrom.value.length === 0 || effectiveFromError.value != null) {
    return "Pick a valid effective date to save.";
  }

  return undefined;
});

async function submit() {
  if (baseRate.value == null || blockReason.value != null) {
    return;
  }

  const plan = await run({
    employeeId,
    body: {
      frequency: frequency.value,
      rateBasis: rateBasis.value,
      baseRate: baseRate.value,
      quota: quota.value > 0 ? quota.value : undefined,
      incentivePerContainer: incentive.value,
      deductionCapPct: deductionCapPct.value,
      restWeekday: restWeekday.value ?? undefined,
      ptoDaysOverride: ptoDaysOverride.value,
      maxLoanAmountOverride: maxLoanAmountOverride.value,
      effectiveFrom: effectiveFrom.value,
    },
  });

  if (error.value != null || plan == null) {
    return;
  }

  emit("submit", plan);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit pay plan">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="frequency" label="Frequency" :options="PAY_FREQUENCY_OPTIONS" />
      <UiSelect v-model="rateBasis" label="Rate basis" :options="RATE_BASIS_OPTIONS" />
      <UiMoneyField v-model="baseRate" label="Base rate" />
      <UiNumberField v-model="quota" label="Daily quota (containers)" :min="0" :max="999" />
      <UiMoneyField v-model="incentive" label="Incentive per container above quota" />
      <UiNumberField
        v-model="deductionCapPct"
        label="Deduction cap (% of gross)"
        :is-integer="false"
        :min="DEDUCTION_CAP_PCT.min"
        :max="DEDUCTION_CAP_PCT.max"
        :error="deductionCapError"
        hint="Default 30%"
      />
      <UiSelect v-model="restWeekday" label="Rest weekday" :options="REST_WEEKDAY_OPTIONS" is-clearable placeholder="No fixed rest day" />
      <UiNumberField v-model="ptoDaysOverride" label="PTO days override" :min="0" hint="Leave blank to use the default allowance." />
      <UiMoneyField v-model="maxLoanAmountOverride" label="Max loan override" hint="Leave blank to use the default limit." />
      <UiField
        v-model="effectiveFrom"
        label="Effective date"
        type="date"
        :min="minEffectiveFrom"
        :error="effectiveFromError"
        hint="Applies forward from this date; history is kept."
      />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <p v-if="blockReason != null" id="pay-plan-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'pay-plan-block-reason' : undefined"
            @click="submit"
            >Save pay plan</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
