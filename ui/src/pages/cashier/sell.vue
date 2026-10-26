<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";
import type { TDepositSubBody } from "@wrs/contract/deposit";
import type { TPaymentMethod } from "@wrs/contract/payment";
import type { TPaymentType, TWalkInSaleBody, TWalkInSaleQuoteBody } from "@wrs/contract/sale";
import { ROUTES } from "@/types";
import { getCurrentDrawer } from "@/services/drawer";
import { createWaiverRequest } from "@/services/waiverRequest";
import { createWalkInSale, quoteWalkInSale } from "@/services/walkInSale";

definePage({ meta: { title: "Walk-in sale" } });

type TCartLine = { qty: number; borrowed: number; returned: number };

const EMPTY_LINE: TCartLine = { qty: 0, borrowed: 0, returned: 0 };

const toast = useToast();
const confirmDialog = useConfirm();
const productStore = useProductStore();
const { products } = storeToRefs(productStore);

productStore.load();

const { data: drawer, error: drawerError, reload: reloadDrawer } = useResource(getCurrentDrawer);

const activeProducts = computed(() => products.value.filter((product) => product.active));

const cart = ref<Record<string, TCartLine>>({});
const paymentType = ref<TPaymentType>("cash");
const depositMethod = ref<TPaymentMethod>("cash");
const customer = ref<TCustomer>();
const customerSheetOpen = ref(false);
const quotedKey = ref<string>();

function lineFor(productId: string) {
  return cart.value[productId] ?? EMPTY_LINE;
}

function setLine(productId: string, patch: Partial<TCartLine>) {
  cart.value[productId] = { ...lineFor(productId), ...patch };
}

const containerProducts = computed(() => activeProducts.value.filter((product) => product.containerType != null && lineFor(product.id).qty > 0));

const lines = computed(() =>
  activeProducts.value.flatMap((product) => {
    const { qty, borrowed, returned } = lineFor(product.id);

    return qty > 0 ? [{ productId: product.id, qty, borrowed, returned }] : [];
  })
);

const body = computed<TWalkInSaleBody>(() => ({
  customerId: customer.value?.id,
  lines: lines.value,
  paymentType: paymentType.value,
}));

const quoteBody = computed<TWalkInSaleQuoteBody>(() => ({
  ...body.value,
  depositMethod: lines.value.some(({ borrowed }) => borrowed > 0) ? depositMethod.value : undefined,
}));

const quoteKey = computed(() => JSON.stringify(quoteBody.value));

async function loadQuote(signal: AbortSignal) {
  quotedKey.value = quoteKey.value;

  if (lines.value.length === 0) {
    return undefined;
  }

  return await quoteWalkInSale(quoteBody.value, signal);
}

const { data: quote, isLoading: isQuoting, error: quoteError, reload: reloadQuote } = useResource(loadQuote, { watch: quoteKey, debounce: 300 });

const {
  run: commit,
  isRunning: isCommitting,
  error: commitError,
} = useAction(createWalkInSale, {
  inline: ["credit.not_enabled", "credit.over_limit", "deposit.required", "drawer.not_open", "price.changed", "container.station_short", "validation"],
});

const { run: submitWaiver, isRunning: isRequestingWaiver } = useAction(createWaiverRequest);

const deposit = computed<TDepositSubBody | undefined>(() => {
  const depositLines = quote.value?.depositLines ?? [];

  return depositLines.length > 0 ? { method: depositMethod.value, lines: depositLines } : undefined;
});

const isQuoteFresh = computed(() => !isQuoting.value && quotedKey.value === quoteKey.value);

const alertMessage = computed(() => {
  if (!isQuoteFresh.value) {
    return undefined;
  }

  return quoteError.value?.message ?? quote.value?.blockReason?.message ?? commitError.value?.message;
});

const alertId = computed(() => (alertMessage.value ? "sale-alert" : undefined));

const canConfirm = computed(
  () =>
    lines.value.length > 0 && isQuoteFresh.value && quote.value != null && quoteError.value == null && quote.value.blockReason == null && !isCommitting.value
);

const canRequestWaiver = computed(() => customer.value != null && !customer.value.depositWaived && (quote.value?.depositDue ?? 0) > 0);

function onSelectCustomer(picked: TCustomer) {
  customer.value = picked;
}

function reset() {
  cart.value = {};
  paymentType.value = "cash";
  depositMethod.value = "cash";
  customer.value = undefined;
}

async function requestWaiver() {
  if (customer.value == null) {
    return;
  }

  const isConfirmed = await confirmDialog.confirm({
    title: "Request deposit waiver",
    message: `Ask the owner to waive container deposits for ${fullName(customer.value)}?`,
    confirmLabel: "Request waiver",
  });

  if (!isConfirmed) {
    return;
  }

  const request = await submitWaiver({ customerId: customer.value.id });

  if (request != null) {
    toast.show("Waiver requested");
  }
}

async function confirmSale() {
  if (!canConfirm.value || quote.value == null) {
    return;
  }

  const { lines: quotedLines, amount, depositDue } = quote.value;
  const itemLines = quotedLines.map((line) => `${line.qty}× ${line.productName}: ${formatMoney(line.lineTotal)}`);
  const depositLines = depositDue > 0 ? [`Deposit: ${formatMoney(depositDue)}`] : [];

  const isConfirmed = await confirmDialog.confirm({
    title: "Confirm sale",
    message: [...itemLines, ...depositLines, `Total: ${formatMoney(amount)}`].join("\n"),
  });

  if (!isConfirmed) {
    return;
  }

  await commit({ ...body.value, deposit: deposit.value });

  if (commitError.value != null) {
    reloadQuote();

    return;
  }

  toast.show("Sale saved");
  reset();
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Walk-in sale" />

    <UiEmptyState v-if="drawerError != null" title="Couldn't load" :description="drawerError.message">
      <template #action>
        <UiButton variant="secondary" @click="reloadDrawer">Retry</UiButton>
      </template>
    </UiEmptyState>

    <UiEmptyState v-else-if="drawer === null" title="Open the drawer to sell" description="Sales are recorded against your open drawer session.">
      <template #action>
        <UiButton :to="ROUTES.CASHIER.INDEX">Go to drawer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="drawer != null">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div v-for="product in activeProducts" :key="product.id" class="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
          <span class="text-base font-medium text-zinc-900">{{ product.name }}</span>
          <UiMoneyText v-if="product.currentPrice != null" :centavos="product.currentPrice" tone="muted" />
          <span v-else class="text-sm text-zinc-500">No price set</span>
          <UiStepper :model-value="lineFor(product.id).qty" :min="0" :max="99" @update:model-value="(qty) => setLine(product.id, { qty })" />
        </div>
      </div>

      <UiCard v-if="containerProducts.length > 0" title="Containers">
        <div class="flex flex-col gap-4">
          <div v-for="product in containerProducts" :key="product.id" class="flex flex-col gap-2">
            <span class="text-sm font-medium text-zinc-900">{{ product.name }}</span>
            <div class="flex flex-wrap gap-6">
              <UiStepper
                label="Borrowed"
                :model-value="lineFor(product.id).borrowed"
                :min="0"
                :max="99"
                @update:model-value="(borrowed) => setLine(product.id, { borrowed })"
              />
              <UiStepper
                label="Returned"
                :model-value="lineFor(product.id).returned"
                :min="0"
                :max="99"
                @update:model-value="(returned) => setLine(product.id, { returned })"
              />
            </div>
          </div>
          <template v-if="quote != null && quote.depositDue > 0">
            <p class="text-sm text-zinc-500">Deposit due: <UiMoneyText :centavos="quote.depositDue" size="sm" /></p>
            <UiSegmentedControl v-model="depositMethod" label="Deposit paid by" :options="PAYMENT_METHOD_OPTIONS" />
          </template>
        </div>
      </UiCard>

      <CustomerSelectedCard v-if="customer" title="Customer" :customer @change="customerSheetOpen = true">
        <div v-if="canRequestWaiver" class="mt-3 flex justify-end">
          <UiButton variant="secondary" :loading="isRequestingWaiver" @click="requestWaiver">Request deposit waiver</UiButton>
        </div>
      </CustomerSelectedCard>
      <UiCard v-else title="Customer">
        <UiButton variant="secondary" @click="customerSheetOpen = true">Select customer</UiButton>
      </UiCard>

      <UiCard title="Payment">
        <UiSegmentedControl v-model="paymentType" :options="PAYMENT_OPTIONS" />
      </UiCard>

      <div class="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
        <span class="text-base font-medium text-zinc-700">Total</span>
        <UiMoneyText :centavos="quote?.amount ?? 0" size="xl" />
      </div>

      <div class="flex flex-col items-end gap-2">
        <p v-if="alertMessage" id="sale-alert" role="alert" class="text-sm font-medium text-red-700">{{ alertMessage }}</p>
        <UiButton :disabled="!canConfirm" :loading="isCommitting" :aria-describedby="alertId" @click="confirmSale">Confirm sale</UiButton>
      </div>

      <CashierCustomerPickerSheet v-model:open="customerSheetOpen" @select="onSelectCustomer" />
    </template>
  </div>
</template>
