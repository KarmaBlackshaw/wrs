<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";
import type { TContainerTypeCode } from "@wrs/contract/container";

import { ROUTES } from "@/types";
import { getCurrentDrawer } from "@/services/drawer";
import { commitContainerReturn, quoteContainerReturn } from "@/services/containerReturn";

definePage({ meta: { title: "Return container" } });

const toast = useToast();

const customer = ref<TCustomer>();
const customerSheetOpen = ref(true);
const returned = ref<Partial<Record<TContainerTypeCode, number>>>({});

const holdings = computed(() => {
  const held = customer.value?.heldByType;

  return CONTAINER_TYPE_OPTIONS.map(({ value }) => ({ type: value, held: held?.[value] ?? 0 })).filter(({ held: qty }) => qty > 0);
});

const lines = computed(() => holdings.value.map(({ type }) => ({ containerType: type, qty: returned.value[type] ?? 0 })).filter(({ qty }) => qty > 0));

const canConfirm = computed(() => lines.value.length > 0);

const { data: quote, error: quoteError } = useResource(
  async () => {
    if (customer.value == null || !canConfirm.value) {
      return undefined;
    }

    return quoteContainerReturn({ customerId: customer.value.id, lines: lines.value });
  },
  { watch: [customer, lines], debounce: 300 }
);

const { data: drawer, error: drawerError, reload: reloadDrawer } = useResource(getCurrentDrawer);
const { run, isRunning, error } = useAction(commitContainerReturn, { inline: ["drawer.not_open"] });

function cardTitle(type: TContainerTypeCode) {
  return `${CONTAINER_TYPE_LABEL[type]} container`;
}

function onSelectCustomer(picked: TCustomer) {
  customer.value = picked;
  returned.value = {};
}

async function confirm() {
  if (customer.value == null || !canConfirm.value) {
    return;
  }

  await run({ customerId: customer.value.id, lines: lines.value });

  if (error.value != null) {
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

    <UiEmptyState v-if="drawerError != null" title="Couldn't load" :description="drawerError.message">
      <template #action>
        <UiButton variant="secondary" @click="reloadDrawer">Retry</UiButton>
      </template>
    </UiEmptyState>

    <UiEmptyState v-else-if="drawer === null" title="Open the drawer to return containers" description="Returns are recorded against your open drawer session.">
      <template #action>
        <UiButton :to="ROUTES.CASHIER.INDEX">Go to drawer</UiButton>
      </template>
    </UiEmptyState>

    <UiEmptyState v-else-if="drawer != null && !customer" title="No customer selected" description="Search for a customer to record their container return.">
      <template #action>
        <UiButton @click="customerSheetOpen = true">Select customer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="customer != null">
      <CustomerSelectedCard :customer @change="customerSheetOpen = true" />

      <UiEmptyState v-if="holdings.length === 0" title="No containers on file" description="This customer has no recorded container holdings.">
        <template #action>
          <UiButton variant="secondary" @click="customerSheetOpen = true">Pick another customer</UiButton>
        </template>
      </UiEmptyState>

      <template v-else>
        <UiCard v-for="holding in holdings" :key="holding.type" :title="cardTitle(holding.type)">
          <p class="text-sm text-zinc-500">Holding: {{ holding.held }}</p>
          <UiStepper
            class="mt-2"
            :model-value="returned[holding.type] ?? 0"
            :min="0"
            :max="holding.held"
            @update:model-value="(value) => (returned[holding.type] = value)"
          />
        </UiCard>

        <div class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span class="text-base font-medium text-zinc-700">Deposit refund</span>
          <span v-if="quoteError != null" class="text-sm text-red-600" role="alert">{{ quoteError.message }}</span>
          <UiMoneyText v-else :centavos="quote?.refund ?? 0" size="lg" />
        </div>

        <p v-if="error" role="alert" class="text-sm text-red-700">{{ error.message }}</p>

        <div class="flex justify-end">
          <UiButton :disabled="!canConfirm || quoteError != null" :loading="isRunning" @click="confirm">Confirm return</UiButton>
        </div>
      </template>
    </template>

    <CashierCustomerPickerSheet v-if="drawer" v-model:open="customerSheetOpen" :allow-quick-add="false" @select="onSelectCustomer" />
  </div>
</template>
