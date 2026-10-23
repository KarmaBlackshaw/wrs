<script setup lang="ts">
import type { TOption, TPayFrequency, TPayPlan, TRateBasis } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { employeeId, plan } = defineProps<{
  employeeId: string;
  plan?: TPayPlan;
}>();

const emit = defineEmits<{
  submit: [payPlan: TPayPlan];
}>();

const toast = useToast();

const rateBasisOptions: TOption<TRateBasis>[] = [
  { value: "per_day", label: "Per day" },
  { value: "per_period", label: "Per period" },
];

const frequency = ref<TPayFrequency>("monthly");
const rateBasis = ref<TRateBasis>("per_period");
const baseRate = ref("");
const quota = ref(0);
const incentive = ref("");
const deductionCapPct = ref("");
const effectiveFrom = ref(todayIso());

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  frequency.value = plan?.frequency ?? "monthly";
  rateBasis.value = plan?.rateBasis ?? "per_period";
  baseRate.value = plan ? String(plan.baseRate / 100) : "";
  quota.value = plan?.quota ?? 0;
  incentive.value = plan?.incentivePerContainer ? String(plan.incentivePerContainer / 100) : "";
  deductionCapPct.value = plan?.deductionCapPct ? String(plan.deductionCapPct) : "";
  effectiveFrom.value = todayIso();
});

const canSubmit = computed(() => Number(baseRate.value) >= 0 && effectiveFrom.value.length > 0);

function submit() {
  if (!canSubmit.value) {
    return;
  }

  emit("submit", {
    employeeId,
    frequency: frequency.value,
    rateBasis: rateBasis.value,
    baseRate: Math.round(Number(baseRate.value) * 100),
    quota: quota.value > 0 ? quota.value : undefined,
    incentivePerContainer: incentive.value ? Math.round(Number(incentive.value) * 100) : undefined,
    deductionCapPct: deductionCapPct.value ? Number(deductionCapPct.value) : undefined,
    effectiveFrom: effectiveFrom.value,
  });

  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit pay plan">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="frequency" label="Frequency" :options="PAY_FREQUENCY_OPTIONS" />
      <UiSelect v-model="rateBasis" label="Rate basis" :options="rateBasisOptions" />
      <UiField v-model="baseRate" label="Base rate (₱)" type="number" inputmode="decimal" />
      <UiStepper v-model="quota" label="Daily quota (containers)" :min="0" :max="999" />
      <UiField v-model="incentive" label="Incentive per container above quota (₱)" type="number" inputmode="decimal" />
      <UiField v-model="deductionCapPct" label="Deduction cap (% of gross)" type="number" inputmode="decimal" />
      <UiField v-model="effectiveFrom" label="Effective date" type="date" hint="Applies forward from this date; history is kept." />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmit" @click="submit">Save pay plan</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
