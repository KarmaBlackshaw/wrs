<script setup lang="ts">
import type { TPayFrequency } from "@wrs/contract/employee";
import type { TLoanMethod, TSettingValues, TSettingWrite } from "@wrs/contract/setting";

import { updateContainerType } from "@/services/containerType";
import { createSetting } from "@/services/setting";
import { ROLE_LABEL } from "@/types";

type TNumberBounds = { min: number; max?: number; isInteger: boolean };

const target = defineModel<TSettingTarget>("target");

const emit = defineEmits<{
  submit: [];
}>();

const toast = useToast();
const { run: runSetting, isRunning: isSavingSetting, error: settingError } = useAction(createSetting, { inline: ["validation", "setting.not_set"] });
const { run: runDeposit, isRunning: isSavingDeposit, error: depositError } = useAction(updateContainerType, { inline: ["validation"] });

const reasonId = useId();

const money = ref<number>();
const numberValue = ref<number>();
const payFrequency = ref<TPayFrequency>();
const loanMethod = ref<TLoanMethod>();
const rangeMin = ref<number>();
const rangeMax = ref<number>();
const time = ref("");
const baseRate = ref<Partial<TSettingValues["pay.baseRate"]>>({});
const effectiveFrom = ref(todayIso());

const isOpen = computed({
  get: () => target.value != null,
  set: (value) => {
    if (!value) {
      target.value = undefined;
    }
  },
});

const entry = computed(() => (target.value?.kind === "setting" ? target.value.entry : undefined));

const kind = computed(() => {
  if (target.value?.kind === "deposit") {
    return "money";
  }

  return entry.value != null ? SETTING_KIND[entry.value.key] : undefined;
});

const label = computed(() => {
  if (target.value?.kind === "deposit") {
    return `${CONTAINER_TYPE_LABEL[target.value.containerType.code]} container deposit`;
  }

  return entry.value != null ? SETTING_LABEL[entry.value.key] : "";
});

const unit = computed(() => (entry.value != null ? SETTING_UNIT[entry.value.key] : undefined));
const error = computed(() => settingError.value ?? depositError.value);
const isRunning = computed(() => isSavingSetting.value || isSavingDeposit.value);

const numberBounds = computed((): TNumberBounds => {
  switch (entry.value?.key) {
    case "pay.deductionCapPct":
      return { min: 0, max: 100, isInteger: false };
    case "loan.interestRatePct":
      return { min: 0, isInteger: false };
    case "loan.maxTermMonths":
      return { min: 1, isInteger: true };
    default:
      return { min: 0, isInteger: true };
  }
});

function numberReason(value: number | undefined, { min, max, isInteger }: TNumberBounds) {
  if (value == null) {
    return "Enter a value.";
  }

  if (isInteger && !Number.isInteger(value)) {
    return "Enter a whole number.";
  }

  if (value < min) {
    return `Enter ${min} or more.`;
  }

  if (max != null && value > max) {
    return `Enter ${max} or less.`;
  }

  return undefined;
}

function seed(current: TSettingTarget) {
  money.value = undefined;
  numberValue.value = undefined;
  payFrequency.value = undefined;
  loanMethod.value = undefined;
  rangeMin.value = undefined;
  rangeMax.value = undefined;
  time.value = "";
  baseRate.value = {};
  effectiveFrom.value = todayIso();

  if (current.kind === "deposit") {
    money.value = current.containerType.depositAmount;

    return;
  }

  const { entry: currentEntry } = current;

  switch (currentEntry.key) {
    case "rider.incentivePerContainer":
    case "loan.maxAmount":
    case "customer.creditLimit":
    case "void.approvalThreshold":
      money.value = currentEntry.value ?? undefined;

      return;
    case "pay.frequency":
      payFrequency.value = currentEntry.value ?? undefined;

      return;
    case "loan.interestMethod":
      loanMethod.value = currentEntry.value ?? undefined;

      return;
    case "pay.baseRate":
      baseRate.value = { ...currentEntry.value };

      return;
    case "water.tdsRangePpm":
      rangeMin.value = currentEntry.value?.min;
      rangeMax.value = currentEntry.value?.max;

      return;
    case "digest.sendTime":
      time.value = currentEntry.value ?? "";

      return;
    default:
      numberValue.value = currentEntry.value ?? undefined;
  }
}

watch(target, (current) => {
  if (current != null) {
    seed(current);
  }
});

const settingWrite = computed((): TSettingWrite | string => {
  if (entry.value == null) {
    return "";
  }

  if (effectiveFrom.value === "") {
    return "Pick an effective date.";
  }

  const { key } = entry.value;

  switch (key) {
    case "rider.incentivePerContainer":
    case "loan.maxAmount":
    case "customer.creditLimit":
    case "void.approvalThreshold":
      return money.value != null ? { key, value: money.value, effectiveFrom: effectiveFrom.value } : "Enter an amount.";
    case "pay.frequency":
      return payFrequency.value != null ? { key, value: payFrequency.value, effectiveFrom: effectiveFrom.value } : "Choose a pay frequency.";
    case "loan.interestMethod":
      return loanMethod.value != null ? { key, value: loanMethod.value, effectiveFrom: effectiveFrom.value } : "Choose an interest method.";
    case "pay.baseRate": {
      const { rider, cashier, washer, helper } = baseRate.value;

      if (rider == null || cashier == null || washer == null || helper == null) {
        return "Enter a base rate for every role.";
      }

      return { key, value: { rider, cashier, washer, helper }, effectiveFrom: effectiveFrom.value };
    }
    case "water.tdsRangePpm": {
      const min = rangeMin.value;
      const max = rangeMax.value;

      if (min == null || max == null) {
        return "Enter both min and max.";
      }

      if (min < 0) {
        return "Min must be 0 or more.";
      }

      if (max < min) {
        return "Max must be at least min.";
      }

      return { key, value: { min, max }, effectiveFrom: effectiveFrom.value };
    }
    case "digest.sendTime":
      return time.value !== "" ? { key, value: time.value, effectiveFrom: effectiveFrom.value } : "Enter a send time.";
    default: {
      const value = numberValue.value;
      const reason = numberReason(value, numberBounds.value);

      if (reason != null || value == null) {
        return reason ?? "Enter a value.";
      }

      return { key, value, effectiveFrom: effectiveFrom.value };
    }
  }
});

const blockReason = computed(() => {
  if (target.value?.kind === "deposit") {
    return money.value != null ? undefined : "Enter an amount.";
  }

  return typeof settingWrite.value === "string" ? settingWrite.value : undefined;
});

const describedBy = computed(() => (blockReason.value != null ? reasonId : undefined));

async function submit() {
  if (target.value == null || blockReason.value != null) {
    return;
  }

  if (target.value.kind === "deposit") {
    if (money.value == null) {
      return;
    }

    await runDeposit({ code: target.value.containerType.code, body: { depositAmount: money.value } });

    if (depositError.value != null) {
      return;
    }
  } else {
    if (typeof settingWrite.value === "string") {
      return;
    }

    await runSetting(settingWrite.value);

    if (settingError.value != null) {
      return;
    }
  }

  emit("submit");
  target.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Edit setting">
    <div class="flex flex-col gap-4">
      <UiMoneyField v-if="kind === 'money'" v-model="money" :label />
      <UiNumberField v-else-if="kind === 'number'" v-model="numberValue" :label :hint="unit" v-bind="numberBounds" />
      <UiSelect v-else-if="entry?.key === 'pay.frequency'" v-model="payFrequency" :label :options="PAY_FREQUENCY_OPTIONS" />
      <UiSelect v-else-if="entry?.key === 'loan.interestMethod'" v-model="loanMethod" :label :options="LOAN_METHOD_OPTIONS" />
      <fieldset v-else-if="kind === 'range'" class="flex flex-col gap-2">
        <legend class="mb-2 text-sm font-medium text-zinc-700">{{ label }}</legend>
        <div class="grid grid-cols-2 gap-3">
          <UiNumberField v-model="rangeMin" label="Min" :hint="unit" :min="0" :is-integer="false" />
          <UiNumberField v-model="rangeMax" label="Max" :hint="unit" :min="0" :is-integer="false" />
        </div>
      </fieldset>
      <UiField v-else-if="kind === 'time'" v-model="time" :label type="time" />
      <fieldset v-else-if="kind === 'roleMoney'" class="flex flex-col gap-2">
        <legend class="mb-2 text-sm font-medium text-zinc-700">{{ label }}</legend>
        <UiMoneyField v-for="role in BASE_RATE_ROLES" :key="role" v-model="baseRate[role]" :label="ROLE_LABEL[role]" />
      </fieldset>
      <UiField v-if="entry != null" v-model="effectiveFrom" label="Effective date" type="date" hint="Applies forward from this date; history is kept." />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <p v-if="blockReason != null" :id="reasonId" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :disabled="blockReason != null" :aria-describedby="describedBy" :loading="isRunning" @click="submit">Save</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
