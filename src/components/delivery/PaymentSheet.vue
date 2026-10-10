<script setup lang="ts">
import type { TCustomer } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { customer } = defineProps<{
  customer: TCustomer;
}>();

const toast = useToast();
const paymentAmountInput = ref("");

watch(open, (isOpen) => {
  if (isOpen) {
    paymentAmountInput.value = "";
  }
});

function confirmCollectPayment() {
  open.value = false;
  paymentAmountInput.value = "";
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect payment">
    <div class="flex flex-col gap-4">
      <p class="text-base text-zinc-700">Credit balance for {{ customer.name }}</p>
      <UiMoneyText :centavos="customer.creditBalance" size="sm" tone="warn" />
      <UiMoneyText :centavos="padToCentavos(paymentAmountInput)" size="xl" />
      <UiButton variant="ghost" @click="paymentAmountInput = String(customer.creditBalance)">Use {{ formatMoney(customer.creditBalance) }}</UiButton>
      <UiNumberPad v-model="paymentAmountInput" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmCollectPayment">Record payment</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
