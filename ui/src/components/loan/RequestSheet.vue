<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const toast = useToast();

const requestTypeOptions = [
  { value: "advance", label: "Advance" },
  { value: "loan", label: "Loan" },
];

const requestType = ref("advance");
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
        <UiMoneyPad v-model="amount" />
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
