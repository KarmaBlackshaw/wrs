<script setup lang="ts">
import type { TCustomer } from "@/types";
import { containerHoldings } from "@/mocks/containers";
import { containerTypes } from "@/mocks/containerTypes";

definePage({ meta: { title: "Return container" } });

const toast = useToast();

const customer = ref<TCustomer>();
const customerSheetOpen = ref(true);
const returned = ref<Record<string, number>>({});

const holdings = computed(() => containerHoldings.filter((holding) => holding.location === customer.value?.id));

function qtyFor(type: string) {
  return returned.value[type] ?? 0;
}

function setQty(type: string, qty: number) {
  returned.value[type] = qty;
}

const depositRefund = computed(() =>
  holdings.value.reduce((sum, holding) => {
    const containerType = containerTypes.find((type) => type.code === holding.type);

    return sum + qtyFor(holding.type) * (containerType?.depositAmount ?? 0);
  }, 0)
);

const canConfirm = computed(() => holdings.value.some((holding) => qtyFor(holding.type) > 0));

function onSelectCustomer(picked: TCustomer) {
  customer.value = picked;
  returned.value = {};
}

function confirm() {
  if (!canConfirm.value) {
    return;
  }

  toast.show("Saved");
  returned.value = {};
  customerSheetOpen.value = true;
  customer.value = undefined;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Return container" />

    <UiEmptyState v-if="!customer" title="No customer selected" description="Search for a customer to record their container return.">
      <template #action>
        <UiButton @click="customerSheetOpen = true">Select customer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else>
      <CustomerSelectedCard :customer @change="customerSheetOpen = true" />

      <UiEmptyState v-if="holdings.length === 0" title="No containers on file" description="This customer has no recorded container holdings.">
        <template #action>
          <UiButton variant="secondary" @click="customerSheetOpen = true">Pick another customer</UiButton>
        </template>
      </UiEmptyState>

      <template v-else>
        <UiCard v-for="holding in holdings" :key="holding.type" :title="holding.type === 'round' ? 'Round container' : 'Slim container'">
          <p class="text-sm text-zinc-500">Holding: {{ holding.full }} full, {{ holding.empty }} empty</p>
          <UiStepper
            class="mt-2"
            :model-value="qtyFor(holding.type)"
            :min="0"
            :max="holding.full + holding.empty"
            @update:model-value="(value) => setQty(holding.type, value)"
          />
        </UiCard>

        <div class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span class="text-base font-medium text-zinc-700">Deposit refund</span>
          <UiMoneyText :centavos="depositRefund" size="lg" />
        </div>

        <div class="flex justify-end">
          <UiButton :disabled="!canConfirm" @click="confirm">Confirm return</UiButton>
        </div>
      </template>
    </template>

    <CashierCustomerPickerSheet v-model:open="customerSheetOpen" :allow-quick-add="false" @select="onSelectCustomer" />
  </div>
</template>
