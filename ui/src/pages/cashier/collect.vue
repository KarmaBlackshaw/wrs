<script setup lang="ts">
import type { TCustomer } from "@/types";

definePage({ meta: { title: "Collect payment" } });

const toast = useToast();

const customer = ref<TCustomer>();
const customerSheetOpen = ref(true);
const amount = ref(0);

const canConfirm = computed(() => customer.value != null && amount.value > 0);

function onSelectCustomer(picked: TCustomer) {
  customer.value = picked;
}

function confirm() {
  if (!canConfirm.value) {
    return;
  }

  toast.show("Saved");
  amount.value = 0;
  customerSheetOpen.value = true;
  customer.value = undefined;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Collect payment">
      <template #actions>
        <UiButton v-if="customer" :disabled="!canConfirm" @click="confirm">Record payment</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!customer" title="No customer selected" description="Search for a customer to collect their payment.">
      <template #action>
        <UiButton @click="customerSheetOpen = true">Select customer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else>
      <CustomerSelectedCard :customer @change="customerSheetOpen = true">
        <div class="mt-3 flex items-center justify-between">
          <span class="text-base text-zinc-700">Balance</span>
          <UiMoneyText :centavos="customer.creditBalance" size="lg" :tone="customer.creditBalance > 0 ? 'warn' : 'default'" />
        </div>
        <div class="mt-2 flex justify-end">
          <UiStatusPill :tone="AGING_TONE[customer.agingBucket]">{{ AGING_LABEL[customer.agingBucket] }}</UiStatusPill>
        </div>
      </CustomerSelectedCard>

      <UiMoneyPad v-model="amount" :suggestion="customer.creditBalance" />
    </template>

    <CashierCustomerPickerSheet v-model:open="customerSheetOpen" :allow-quick-add="false" @select="onSelectCustomer" />
  </div>
</template>
