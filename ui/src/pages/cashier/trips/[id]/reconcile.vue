<script setup lang="ts">
import type { TDelivery } from "@wrs/contract/trip";
import { getTrip, reconcileTrip } from "@/services/trip";
import { ROUTES, type TRowAction } from "@/types";

definePage({ meta: { title: "Reconcile trip", roles: ["cashier", "owner"] } });

const route = useRoute<"/cashier/trips/[id]/reconcile">();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const tripId = route.params.id;

const { data: trip, isLoading, error: loadError, reload } = useResource((signal) => getTrip(tripId, signal));
const { run, isRunning, error } = useAction(reconcileTrip);

const tripsHomeRoute = computed(() => (authStore.activeRole === "owner" ? ROUTES.OWNER.TRIPS : ROUTES.CASHIER.TRIPS.INDEX));

const isReconcilable = computed(() => trip.value?.status === "returned");

const fullVariance = computed(() => trip.value?.lines.reduce((sum, { varianceFull }) => sum + (varianceFull ?? 0), 0) ?? 0);
const emptyVariance = computed(() => trip.value?.lines.reduce((sum, { varianceEmpty }) => sum + (varianceEmpty ?? 0), 0) ?? 0);
const cashVariance = computed(() => trip.value?.cashVariance ?? 0);

const hasVariance = computed(() => fullVariance.value !== 0 || emptyVariance.value !== 0 || cashVariance.value !== 0);

const suggestedShortageCash = computed(() => Math.max(0, -cashVariance.value));
const shortageSheetOpen = ref(false);
const initialShortageContainers = computed(() => Math.max(0, -fullVariance.value));

const voidSheetOpen = ref(false);
const voidTargetSummary = ref("");

const productColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "productName", label: "Product" },
  { key: "full", label: "Full" },
  { key: "empty", label: "Empty" },
];

const deliveryColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "customerName", label: "Customer" },
  { key: "products", label: "Products" },
  { key: "payment", label: "Payment" },
  { key: "amount", label: "Amount", align: "right" },
];

function productsText(delivery: TDelivery) {
  return delivery.lines.map(({ productName, qty }) => `${qty} x ${productName}`).join(", ");
}

function openVoid(delivery: TDelivery) {
  voidTargetSummary.value = `Delivery to ${delivery.customerName}, ${productsText(delivery)}, ${formatMoney(delivery.amount)}`;
  voidSheetOpen.value = true;
}

async function reconcile() {
  await run(tripId);

  if (error.value != null) {
    return;
  }

  toast.show("Saved");
  router.push(tripsHomeRoute.value);
}

function deliveryActions(delivery: TDelivery): TRowAction[] {
  return [{ label: "Request void", variant: "ghost", onSelect: () => openVoid(delivery) }];
}
</script>

<template>
  <UiEmptyState v-if="loadError != null" title="Couldn't load" :description="loadError.message">
    <template #action>
      <UiButton variant="secondary" @click="reload">Retry</UiButton>
    </template>
  </UiEmptyState>

  <div v-else-if="trip != null" class="flex flex-col gap-4">
    <UiPageHeader title="Reconcile trip" :subtitle="`Loaded ${formatDateTime(trip.loadedAt)}`" :back="tripsHomeRoute">
      <template #actions>
        <UiStatusPill :tone="TRIP_STATUS_TONE[trip.status]">{{ TRIP_STATUS_LABEL[trip.status] }}</UiStatusPill>
        <UiButton v-if="isReconcilable" :loading="isRunning" @click="reconcile">Reconcile</UiButton>
      </template>
    </UiPageHeader>

    <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>

    <UiDataTable :columns="productColumns" :rows="trip.lines" :row-key="(row) => row.productId">
      <template #cell-full="{ row }">
        <UiVariancePill v-if="row.varianceFull != null" :value="row.varianceFull" />
      </template>
      <template #cell-empty="{ row }">
        <UiVariancePill v-if="row.varianceEmpty != null" :value="row.varianceEmpty" />
      </template>
    </UiDataTable>

    <UiCard title="Cash">
      <div class="flex items-center justify-between">
        <span class="text-sm text-zinc-500">Expected <UiMoneyText :centavos="trip.expectedCash" size="sm" /></span>
        <UiVariancePill v-if="trip.cashVariance != null" :value="trip.cashVariance" is-money />
      </div>
    </UiCard>

    <UiDataTable :row-actions="deliveryActions" title="Deliveries" :columns="deliveryColumns" :rows="trip.deliveries" :row-key="(row) => row.id">
      <template #cell-products="{ row }">{{ productsText(row) }}</template>
      <template #cell-payment="{ row }">{{ PAYMENT_LABEL[row.paymentType] }}</template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.amount" />
      </template>
      <template #empty>
        <p class="p-4 text-base text-zinc-500">No deliveries logged.</p>
      </template>
    </UiDataTable>

    <UiButton v-if="hasVariance" variant="secondary" @click="shortageSheetOpen = true">Record shortage</UiButton>

    <TripShortageSheet v-model:open="shortageSheetOpen" :suggested-shortage-cash="suggestedShortageCash" :initial-containers="initialShortageContainers" />

    <VoidRequestSheet v-model:open="voidSheetOpen" :summary="voidTargetSummary" />
  </div>

  <UiPageHeader v-else-if="isLoading" title="Reconcile trip" :back="tripsHomeRoute" />
</template>
