<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { MONEY_MAX } from "@wrs/contract/rules/moneyLimits";

import { setCustomerCredit } from "@/services/customer";

const customer = defineModel<TCustomer>("customer");

const emit = defineEmits<{
  submit: [customer: TCustomer];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(setCustomerCredit, { inline: ["validation"] });

const isOpen = computed({
  get: () => customer.value != null,
  set: (value) => {
    if (!value) {
      customer.value = undefined;
    }
  },
});

const creditEnabledDraft = ref("enabled");
const limitDraft = ref<number>();
const reasonId = useId();

const creditOptions = [
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];

const limitHint = computed(() => {
  const effectiveLimit = customer.value?.creditLimit;

  return effectiveLimit != null ? `Current limit ${formatMoney(effectiveLimit)}. Leave empty to use the default.` : "Leave empty to use the default limit.";
});

const limitError = computed(() => (limitDraft.value != null && limitDraft.value > MONEY_MAX ? `Limit can't exceed ${formatMoney(MONEY_MAX)}` : undefined));

const isUnchanged = computed(() => {
  if (customer.value == null) {
    return true;
  }

  const isEnabled = creditEnabledDraft.value === "enabled";

  return isEnabled === customer.value.creditEnabled && (limitDraft.value ?? undefined) === (customer.value.creditLimitOverride ?? undefined);
});

const blockReason = computed(() => {
  if (limitError.value != null && creditEnabledDraft.value === "enabled") {
    return "Fix the highlighted field.";
  }

  return isUnchanged.value ? "No changes to save" : undefined;
});

watch(isOpen, (value) => {
  if (value && customer.value != null) {
    creditEnabledDraft.value = customer.value.creditEnabled ? "enabled" : "disabled";
    limitDraft.value = customer.value.creditLimitOverride ?? undefined;
  }
});

async function submit() {
  if (customer.value == null) {
    return;
  }

  const updated = await run({
    id: customer.value.id,
    body: { enabled: creditEnabledDraft.value === "enabled", limitOverride: limitDraft.value ?? null },
  });

  if (error.value != null || updated == null) {
    return;
  }

  toast.show("Credit settings saved");
  emit("submit", updated);
  customer.value = undefined;
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Credit settings">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="creditEnabledDraft" label="Credit" :options="creditOptions" />
      <UiMoneyField v-if="creditEnabledDraft === 'enabled'" v-model="limitDraft" label="Credit limit override" :hint="limitHint" :error="limitError" />
      <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" :id="reasonId" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :aria-describedby="blockReason != null ? reasonId : undefined"
            :loading="isRunning"
            @click="submit"
            >Save</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
