<script setup lang="ts">
import type { TLoan, TLoanType } from "@wrs/contract/loan";

import { requestLoan } from "@/services/loan";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [loan: TLoan] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(requestLoan, { inline: ["loan.over_max", "validation"] });

const requestType = ref<TLoanType>("advance");
const amount = ref(0);
const termMonths = ref(3);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  requestType.value = "advance";
  amount.value = 0;
  termMonths.value = 3;
});

const canSubmit = computed(() => amount.value > 0);

async function submit() {
  if (!canSubmit.value) {
    return;
  }

  const isLoan = requestType.value === "loan";

  const loan = await run({
    type: requestType.value,
    principal: amount.value,
    termMonths: isLoan ? termMonths.value : undefined,
  });

  if (error.value != null || loan == null) {
    return;
  }

  emit("submit", loan);
  open.value = false;
  toast.show("Request sent for approval");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Request advance or loan">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="requestType" :options="LOAN_TYPE_OPTIONS" />
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">Amount</p>
        <UiMoneyPad v-model="amount" />
      </div>
      <UiStepper v-if="requestType === 'loan'" v-model="termMonths" label="Term (months)" :min="1" :max="24" />
    </div>
    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!canSubmit" :loading="isRunning" @click="submit">Submit request</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
