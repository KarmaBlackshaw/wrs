<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const toast = useToast();

const requestTypeOptions = [
  { value: "advance", label: "Advance" },
  { value: "loan", label: "Loan" },
];

const requestType = ref("advance");
const amountInput = ref("");
const termMonths = ref(3);

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  requestType.value = "advance";
  amountInput.value = "";
  termMonths.value = 3;
});

const canSubmit = computed(() => padToCentavos(amountInput.value) > 0);

function submit() {
  if (!canSubmit.value) {
    return;
  }

  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Request advance or loan">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="requestType" :options="requestTypeOptions" />
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">Amount</p>
        <UiMoneyText :centavos="padToCentavos(amountInput)" size="lg" />
        <UiNumberPad v-model="amountInput" />
      </div>
      <UiStepper v-if="requestType === 'loan'" v-model="termMonths" label="Term (months)" :min="1" :max="24" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmit" @click="submit">Submit request</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
