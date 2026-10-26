<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";
import type { TPaymentMethod } from "@wrs/contract/payment";

import { ROUTES } from "@/types";
import { getCustomer } from "@/services/customer";
import { getCurrentDrawer } from "@/services/drawer";
import { createPayment } from "@/services/payment";

definePage({ meta: { title: "Collect payment" } });

const toast = useToast();

const customer = ref<TCustomer>();
const customerSheetOpen = ref(true);
const amount = ref(0);
const method = ref<TPaymentMethod>("cash");

const { data: drawer, error: drawerError, reload: reloadDrawer } = useResource(getCurrentDrawer);
const { run, isRunning, error } = useAction(createPayment, { inline: ["payment.over_balance", "drawer.not_open"] });
const { run: refetchCustomer } = useAction(getCustomer);

const canConfirm = computed(() => customer.value != null && amount.value > 0);

watch(amount, (value) => {
  if (customer.value != null && value > customer.value.creditBalance) {
    amount.value = customer.value.creditBalance;
  }
});

function onSelectCustomer(picked: TCustomer) {
  customer.value = picked;
  amount.value = 0;
}

async function confirm() {
  if (customer.value == null || !canConfirm.value) {
    return;
  }

  const { id } = customer.value;

  await run({ customerId: id, amount: amount.value, method: method.value });

  if (error.value != null) {
    return;
  }

  toast.show("Payment recorded");
  customer.value = (await refetchCustomer(id)) ?? customer.value;
  amount.value = 0;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Collect payment">
      <template #actions>
        <UiButton v-if="customer && drawer" :disabled="!canConfirm" :loading="isRunning" @click="confirm">Record payment</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="drawerError != null" title="Couldn't load" :description="drawerError.message">
      <template #action>
        <UiButton variant="secondary" @click="reloadDrawer">Retry</UiButton>
      </template>
    </UiEmptyState>

    <UiEmptyState v-else-if="drawer === null" title="Open the drawer to collect" description="Payments are recorded against your open drawer session.">
      <template #action>
        <UiButton :to="ROUTES.CASHIER.INDEX">Go to drawer</UiButton>
      </template>
    </UiEmptyState>

    <UiEmptyState v-else-if="drawer != null && !customer" title="No customer selected" description="Search for a customer to collect their payment.">
      <template #action>
        <UiButton @click="customerSheetOpen = true">Select customer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="customer != null">
      <CustomerSelectedCard :customer @change="customerSheetOpen = true">
        <div class="mt-3 flex items-center justify-between">
          <span class="text-base text-zinc-700">Balance</span>
          <UiMoneyText :centavos="customer.creditBalance" size="lg" :tone="customer.creditBalance > 0 ? 'warn' : 'default'" />
        </div>
        <div v-if="customer.agingBucket != null" class="mt-2 flex justify-end">
          <UiStatusPill :tone="AGING_TONE[customer.agingBucket]">{{ AGING_LABEL[customer.agingBucket] }}</UiStatusPill>
        </div>
      </CustomerSelectedCard>

      <UiSegmentedControl v-model="method" label="Paid by" :options="PAYMENT_METHOD_OPTIONS" />
      <UiMoneyPad v-model="amount" :suggestion="customer.creditBalance" />
      <p v-if="error" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
    </template>

    <CashierCustomerPickerSheet v-if="drawer" v-model:open="customerSheetOpen" balance="owing" :allow-quick-add="false" @select="onSelectCustomer" />
  </div>
</template>
