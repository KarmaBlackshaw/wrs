<script setup lang="ts">
import type { TCustomer } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { customer } = defineProps<{
  customer: TCustomer;
}>();

const toast = useToast();
const paymentAmount = ref(0);

watch(open, (isOpen) => {
  if (isOpen) {
    paymentAmount.value = 0;
  }
});

function confirmCollectPayment() {
  open.value = false;
  paymentAmount.value = 0;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect payment">
    <div class="flex flex-col gap-4">
      <p class="text-base text-zinc-700">Credit balance for {{ customer.name }}</p>
      <UiMoneyText :centavos="customer.creditBalance" size="sm" tone="warn" />
      <UiMoneyPad v-model="paymentAmount" :suggestion="customer.creditBalance" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmCollectPayment">Record payment</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
