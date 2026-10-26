<script setup lang="ts">
import type { TDepositSubBody } from "@wrs/contract/deposit";
import { creditBlock } from "@wrs/contract/rules/creditBlock";
import { depositDue } from "@wrs/contract/rules/depositDue";
import { priceAt } from "@wrs/contract/rules/priceAt";
import type { TPaymentType } from "@wrs/contract/sale";

import { ROUTES } from "@/types";

definePage({ meta: { title: "Log delivery" } });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirmDialog = useConfirm();
const riderStore = useRiderStore();
const syncStore = useSyncStore();
const { isHydrated, trip, products, containerTypes, allCustomers } = storeToRefs(riderStore);

const tripId = computed(() => String(route.params.id));

const customerId = computed(() => {
  const raw = route.params.customerId;

  if (Array.isArray(raw)) {
    return raw[0];
  }

  return raw || undefined;
});

const CREDIT_BLOCK_MESSAGE = {
  "credit.not_enabled": "Credit is not enabled for this customer, take cash.",
  "credit.over_limit": "This would put the customer over their credit limit, take cash.",
  "setting.not_set": "The default credit limit is not set, take cash.",
};

const hasSnapshot = computed(() => trip.value != null || products.value.length > 0 || allCustomers.value.length > 0);
const openTrip = computed(() => (trip.value?.id === tripId.value ? trip.value : undefined));
const isTripEnded = computed(() => openTrip.value != null && openTrip.value.status !== "open");
const customer = computed(() => (customerId.value != null ? riderStore.customer(customerId.value) : undefined));
const customerName = computed(() => (customer.value != null ? fullName(customer.value) : undefined));

const isAlreadyDelivered = computed(
  () => openTrip.value?.deliveries.some((delivery) => delivery.customerId === customerId.value && delivery.voidedAt == null) ?? false
);

const isNothingLeft = computed(() => openTrip.value?.lines.every(({ remaining }) => remaining <= 0) ?? false);

const drafts = ref<{ productId: string; qty: number; emptiesCollected: number }[]>([]);
const paymentType = ref<TPaymentType>("cash");
const deposit = shallowRef<TDepositSubBody>();
const isDepositSheetOpen = ref(false);
const isPaymentSheetOpen = ref(false);
const isSaving = ref(false);
const blockReasonId = useId();

watch(
  [customerId, () => openTrip.value?.id],
  () => {
    drafts.value = (openTrip.value?.lines ?? []).filter(({ remaining }) => remaining > 0).map(({ productId }) => ({ productId, qty: 0, emptiesCollected: 0 }));
    paymentType.value = "cash";
    deposit.value = undefined;
  },
  { immediate: true }
);

function unitPriceOf(productId: string, fallback: number) {
  const product = products.value.find(({ id }) => id === productId);

  if (product == null) {
    return fallback;
  }

  const points = product.currentPrice != null ? [{ amount: product.currentPrice, effectiveFrom: "" }, ...product.upcomingPrices] : product.upcomingPrices;

  return priceAt(points, new Date().toISOString()) ?? fallback;
}

const rows = computed(() =>
  drafts.value.flatMap((draft) => {
    const line = openTrip.value?.lines.find(({ productId }) => productId === draft.productId);

    if (line == null) {
      return [];
    }

    const containerType = products.value.find(({ id }) => id === draft.productId)?.containerType ?? null;

    return [{ draft, line, containerType, unitPrice: unitPriceOf(draft.productId, line.unitPrice) }];
  })
);

const deliveredRows = computed(() => rows.value.filter(({ draft }) => draft.qty > 0));
const amount = computed(() => deliveredRows.value.reduce((sum, { draft, unitPrice }) => sum + draft.qty * unitPrice, 0));

const borrowed = computed(() =>
  deliveredRows.value.flatMap(({ draft, containerType }) => (containerType != null ? [{ containerType, qty: draft.qty - draft.emptiesCollected }] : []))
);

const isLending = computed(() => borrowed.value.some(({ qty }) => qty > 0));

const depositLines = computed<TDepositSubBody["lines"]>(() => {
  const current = customer.value;

  if (current == null) {
    return [];
  }

  let onFile = current.depositOnFile;

  return containerTypes.value.flatMap((containerType) => {
    const required = depositDue({ customer: { ...current, depositOnFile: 0 }, containerTypes: [containerType], borrowed: borrowed.value });
    const lineAmount = Math.max(0, required - onFile);

    onFile = Math.max(0, onFile - required);

    return lineAmount > 0 ? [{ containerType: containerType.code, qty: Math.ceil(lineAmount / containerType.depositAmount), amount: lineAmount }] : [];
  });
});

const depositDueTotal = computed(() => depositLines.value.reduce((sum, { amount: lineAmount }) => sum + lineAmount, 0));
const depositCollected = computed(() => deposit.value?.lines.reduce((sum, { amount: lineAmount }) => sum + lineAmount, 0) ?? 0);
const isDepositShort = computed(() => isLending.value && depositCollected.value < depositDueTotal.value);
const canRequestWaiver = computed(() => customer.value != null && !customer.value.depositWaived && depositDueTotal.value > 0);

const blockReason = computed(() => {
  if (customer.value == null) {
    return undefined;
  }

  if (deliveredRows.value.length === 0) {
    return "Enter a delivered quantity before confirming.";
  }

  const creditCode = paymentType.value === "credit" ? creditBlock(customer.value, amount.value) : undefined;

  if (creditCode != null) {
    return CREDIT_BLOCK_MESSAGE[creditCode];
  }

  if (isDepositShort.value) {
    return "Collect the container deposit first.";
  }

  return undefined;
});

const balanceTone = computed(() => ((customer.value?.creditBalance ?? 0) > 0 ? "warn" : "default"));
const alreadyDeliveredDescription = computed(() => `You delivered to ${customerName.value} on this trip. You can still collect a payment.`);
const confirmDescribedBy = computed(() => (blockReason.value != null ? blockReasonId : undefined));
const backTo = computed(() => (customerId.value != null ? ROUTES.RIDER.DELIVER(tripId.value) : ROUTES.RIDER.INDEX));
const chooseCustomerTo = computed(() => ROUTES.RIDER.DELIVER(tripId.value));

function pickCustomer({ id }: { id: string }) {
  return ROUTES.RIDER.DELIVER(tripId.value, id);
}

async function requestWaiver() {
  if (customer.value == null) {
    return;
  }

  const isConfirmed = await confirmDialog.confirm({
    title: "Request deposit waiver",
    message: `Ask the owner to waive container deposits for ${customerName.value}?`,
    confirmLabel: "Request waiver",
  });

  if (!isConfirmed) {
    return;
  }

  const id = crypto.randomUUID();

  try {
    await syncStore.enqueue({ kind: "waiver_request.create", opId: id, payload: { id, customerId: customer.value.id } });
  } catch (error) {
    console.error(error);
    toast.show("Couldn't save the request on this device");

    return;
  }

  toast.show("Waiver requested");
}

async function confirmDelivery() {
  if (blockReason.value != null || customer.value == null || openTrip.value == null) {
    return;
  }

  const sentDeposit = isLending.value ? deposit.value : undefined;

  const isConfirmed = await confirmDialog.confirm({
    title: "Confirm delivery",
    message: [
      customerName.value,
      ...deliveredRows.value.map(
        ({ draft, line, unitPrice }) => `${line.productName} × ${draft.qty} at ${formatMoney(unitPrice)} · ${draft.emptiesCollected} empties`
      ),
      `Total ${formatMoney(amount.value)} · ${PAYMENT_LABEL[paymentType.value]}`,
      ...(sentDeposit != null ? [`Deposit ${formatMoney(depositCollected.value)} · ${PAYMENT_METHOD_LABEL[sentDeposit.method]}`] : []),
    ].join("\n"),
  });

  if (!isConfirmed) {
    return;
  }

  const id = crypto.randomUUID();

  isSaving.value = true;

  try {
    await syncStore.enqueue({
      kind: "delivery.create",
      opId: id,
      payload: {
        id,
        tripId: openTrip.value.id,
        customerId: customer.value.id,
        lines: deliveredRows.value.map(({ draft, unitPrice }) => ({ ...draft, unitPrice })),
        paymentType: paymentType.value,
        deposit: sentDeposit,
      },
    });
  } catch (error) {
    console.error(error);
    toast.show("Couldn't save the delivery on this device");

    return;
  } finally {
    isSaving.value = false;
  }

  toast.show("Delivery saved");
  router.push(ROUTES.RIDER.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Log delivery" :subtitle="customerName" :back="backTo" />

    <UiEmptyState v-if="!isHydrated" title="Loading" description="Reading your saved trip." />

    <UiEmptyState v-else-if="!hasSnapshot" title="No route on this device" description="Connect to the internet once to download your trip and customers." />

    <UiEmptyState v-else-if="openTrip == null" title="No open trip" description="Ask the cashier to load out your trip." />

    <UiEmptyState v-else-if="isTripEnded" title="Trip ended" description="Deliveries are locked after you end the trip.">
      <template #action>
        <UiButton variant="secondary" :to="ROUTES.RIDER.INDEX">Back to trip</UiButton>
      </template>
    </UiEmptyState>

    <RiderCustomerList v-else-if="customerId == null" :get-to="pickCustomer" />

    <UiEmptyState v-else-if="customer == null" title="Customer not on this device" description="Sync when online, or choose another customer.">
      <template #action>
        <UiButton variant="secondary" :to="chooseCustomerTo">Choose customer</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="isAlreadyDelivered">
      <UiEmptyState title="Already delivered" :description="alreadyDeliveredDescription">
        <template #action>
          <UiButton variant="secondary" @click="isPaymentSheetOpen = true">Collect payment</UiButton>
        </template>
      </UiEmptyState>
      <DeliveryPaymentSheet v-model:open="isPaymentSheetOpen" :customer-id="customer.id" :trip-id="openTrip.id" />
    </template>

    <UiEmptyState v-else-if="isNothingLeft" title="Nothing left to deliver" description="Everything on this trip is out. End the trip to return." />

    <template v-else>
      <UiCard title="Customer">
        <div class="flex flex-col gap-1">
          <p class="text-lg font-semibold text-zinc-900">{{ customerName }}</p>
          <p class="text-base text-zinc-500">{{ customer.address }}</p>
          <a :href="`tel:${customer.phone}`" class="text-base font-medium text-brand-600">{{ customer.phone }}</a>
        </div>
        <dl class="mt-3 flex flex-col gap-1 text-sm text-zinc-500">
          <div class="flex items-center justify-between gap-3">
            <dt>Credit balance</dt>
            <dd><UiMoneyText :centavos="customer.creditBalance" size="sm" :tone="balanceTone" /></dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt>Credit limit</dt>
            <dd>
              <UiMoneyText v-if="customer.creditEnabled && customer.creditLimit != null" :centavos="customer.creditLimit" size="sm" />
              <span v-else>{{ customer.creditEnabled ? "Not set" : "No credit" }}</span>
            </dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt>Deposit on file</dt>
            <dd>
              <span v-if="customer.depositWaived">Waived</span>
              <UiMoneyText v-else :centavos="customer.depositOnFile" size="sm" />
            </dd>
          </div>
        </dl>
        <div v-if="customer.creditBalance > 0" class="mt-3 flex justify-end">
          <UiButton variant="secondary" @click="isPaymentSheetOpen = true">Collect payment</UiButton>
        </div>
      </UiCard>

      <UiCard title="Quantities">
        <div class="flex flex-col gap-4">
          <div v-for="row in rows" :key="row.draft.productId" class="flex flex-col gap-3 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0">
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-base font-semibold text-zinc-900">{{ row.line.productName }}</p>
              <p class="text-sm text-zinc-500">{{ row.line.remaining }} left · {{ formatMoney(row.unitPrice) }} each</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UiStepper v-model="row.draft.qty" label="Delivered (full)" :min="0" :max="row.line.remaining" />
              <UiStepper v-if="row.containerType != null" v-model="row.draft.emptiesCollected" label="Empties collected" :min="0" />
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard title="Amount">
        <UiMoneyText :centavos="amount" size="xl" />
      </UiCard>

      <UiCard title="Payment">
        <UiSegmentedControl v-model="paymentType" :options="PAYMENT_OPTIONS" />
      </UiCard>

      <UiCard v-if="depositDueTotal > 0" title="Container deposit">
        <div class="flex flex-col gap-3">
          <p class="flex items-center justify-between gap-3 text-base text-zinc-700">
            Deposit due
            <UiMoneyText :centavos="depositDueTotal" size="sm" />
          </p>
          <p v-if="depositCollected >= depositDueTotal" class="flex items-center justify-between gap-3 text-sm font-medium text-emerald-700">
            Deposit collected
            <UiMoneyText :centavos="depositCollected" size="sm" tone="ok" />
          </p>
          <div class="flex flex-wrap justify-end gap-2">
            <UiButton v-if="canRequestWaiver" variant="ghost" @click="requestWaiver">Request waiver</UiButton>
            <UiButton variant="secondary" @click="isDepositSheetOpen = true">Collect deposit</UiButton>
          </div>
        </div>
      </UiCard>

      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" :id="blockReasonId" role="alert" class="text-sm font-medium text-red-700">{{ blockReason }}</p>
        <UiButton size="lg" :disabled="blockReason != null" :aria-describedby="confirmDescribedBy" :loading="isSaving" @click="confirmDelivery">
          Confirm delivery
        </UiButton>
      </div>

      <DeliveryDepositSheet v-model:open="isDepositSheetOpen" :lines="depositLines" @submit="deposit = $event" />
      <DeliveryPaymentSheet v-model:open="isPaymentSheetOpen" :customer-id="customer.id" :trip-id="openTrip.id" />
    </template>
  </div>
</template>
