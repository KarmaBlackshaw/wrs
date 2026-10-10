<script setup lang="ts">
import { ROUTES } from "@/types";
import type { TCustomer, TPaymentType } from "@/types";
import { containerTypes } from "@/mocks/containerTypes";
import { customers } from "@/mocks/customers";
import { products } from "@/mocks/products";
import { deliveries, trips } from "@/mocks/trips";

definePage({ meta: { title: "Log delivery" } });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const tripId = computed(() => String(route.params.id));

const customerId = computed(() => {
  const raw = route.params.customerId;

  if (Array.isArray(raw)) {
    return raw[0];
  }

  return raw || undefined;
});

const trip = computed(() => trips.find((candidate) => candidate.id === tripId.value) ?? null);
const customer = computed(() => (customerId.value ? (customers.find((candidate) => candidate.id === customerId.value) ?? null) : null));

const product = products.find((candidate) => candidate.kind === "refill" && candidate.containerType === "round" && candidate.active);
const roundContainer = containerTypes.find((candidate) => candidate.code === "round");

const priceCentavos = computed(() => (product ? currentPrice(product.id) : 0));

const lastDelivery = computed(() => {
  if (!customer.value) {
    return null;
  }

  return deliveries.filter((delivery) => delivery.customerId === customer.value?.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null;
});

const delivered = ref(0);
const empties = ref(0);

watch(
  lastDelivery,
  (value) => {
    delivered.value = value?.delivered ?? 0;
    empties.value = value?.emptiesCollected ?? 0;
  },
  { immediate: true }
);

const amount = computed(() => priceCentavos.value * delivered.value);

const paymentType = ref<TPaymentType>("cash");

const creditReason = computed(() => {
  if (paymentType.value !== "credit" || !customer.value) {
    return null;
  }

  return creditBlockReason(customer.value, amount.value);
});

const borrowedQty = computed(() => Math.max(0, delivered.value - empties.value));
const needsDeposit = computed(() => borrowedQty.value > 0 && !customer.value?.depositWaived && (customer.value?.depositOnFile ?? 0) <= 0);
const depositCollected = ref(0);
const depositSheetOpen = ref(false);
const depositSuggestion = roundContainer?.depositAmount ?? 0;

const blockReason = computed(() => {
  if (delivered.value === 0) {
    return "Enter a delivered quantity before confirming";
  }

  if (creditReason.value) {
    return creditReason.value;
  }

  if (needsDeposit.value && depositCollected.value === 0) {
    return `Deposit required, ${customer.value?.name ?? "customer"} has no deposit on file`;
  }

  return null;
});

const canConfirm = computed(() => blockReason.value === null);

const collectPaymentOpen = ref(false);

const confirmOpen = ref(false);

function openConfirmDialog() {
  if (!canConfirm.value) {
    return;
  }

  confirmOpen.value = true;
}

function confirmDelivery() {
  confirmOpen.value = false;
  toast.show("Saved");
  router.push(ROUTES.RIDER.INDEX);
}

function pickCustomer(candidate: TCustomer) {
  return ROUTES.RIDER.DELIVER(tripId.value, candidate.id);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Log delivery" :subtitle="customer?.name" :back="ROUTES.RIDER.INDEX" />

    <UiEmptyState v-if="!trip" title="Trip not found" description="This trip may not exist." />

    <RiderCustomerList v-else-if="!customer" :get-to="pickCustomer" />

    <template v-else>
      <UiCard title="Customer">
        <div class="flex flex-col gap-1">
          <p class="text-lg font-semibold text-zinc-900">{{ customer.name }}</p>
          <p class="text-base text-zinc-500">{{ customer.address }}</p>
          <a :href="`tel:${customer.phone}`" class="text-base font-medium text-brand-600">{{ customer.phone }}</a>
        </div>
        <div v-if="customer.creditBalance > 0" class="mt-3 flex items-center justify-between gap-3">
          <p class="text-sm text-zinc-500">
            Credit balance
            <UiMoneyText :centavos="customer.creditBalance" size="sm" tone="warn" />
          </p>
          <UiButton variant="secondary" @click="collectPaymentOpen = true">Collect payment</UiButton>
        </div>
      </UiCard>

      <UiCard title="Quantities">
        <div class="flex flex-col gap-4">
          <UiStepper v-model="delivered" label="Delivered (full)" :min="0" :max="50" />
          <UiStepper v-model="empties" label="Empties collected" :min="0" :max="50" />
        </div>
      </UiCard>

      <UiCard title="Amount">
        <UiMoneyText :centavos="amount" size="xl" />
        <p v-if="product" class="mt-1 text-sm text-zinc-500">{{ product.name }} × {{ delivered }} at {{ formatMoney(priceCentavos) }} each</p>
      </UiCard>

      <UiCard title="Payment">
        <UiSegmentedControl v-model="paymentType" :options="PAYMENT_OPTIONS" />
      </UiCard>

      <UiCard v-if="borrowedQty > 0" title="Borrowed container">
        <p class="text-base text-zinc-700">{{ borrowedQty }} container(s) left without an empty in return.</p>
        <div v-if="needsDeposit" class="mt-3 flex items-center justify-between gap-3">
          <p v-if="depositCollected === 0" class="text-sm font-medium text-red-700">Deposit required, no deposit on file</p>
          <p v-else class="text-sm font-medium text-emerald-700">
            Deposit collected
            <UiMoneyText :centavos="depositCollected" size="sm" tone="ok" />
          </p>
          <UiButton v-if="depositCollected === 0" variant="secondary" @click="depositSheetOpen = true">Collect deposit</UiButton>
        </div>
      </UiCard>

      <div class="flex flex-col gap-2">
        <p v-if="blockReason" class="text-sm font-medium text-red-700">{{ blockReason }}</p>
        <UiButton :disabled="!canConfirm" @click="openConfirmDialog">Confirm delivery</UiButton>
      </div>

      <DeliveryDepositSheet v-model:open="depositSheetOpen" :deposit-amount="depositSuggestion" @submit="depositCollected = $event" />

      <DeliveryPaymentSheet v-model:open="collectPaymentOpen" :customer="customer" />

      <UiDialog v-model:open="confirmOpen" title="Confirm delivery">
        <div class="flex flex-col items-center gap-2 py-2">
          <p class="text-base text-zinc-500">{{ customer.name }}</p>
          <UiMoneyText :centavos="amount" size="xl" />
          <p class="text-sm text-zinc-500">{{ delivered }} delivered · {{ empties }} empties · {{ PAYMENT_LABEL[paymentType] }}</p>
        </div>
        <template #footer>
          <UiButton variant="secondary" @click="confirmOpen = false">Cancel</UiButton>
          <UiButton @click="confirmDelivery">Confirm</UiButton>
        </template>
      </UiDialog>
    </template>
  </div>
</template>
