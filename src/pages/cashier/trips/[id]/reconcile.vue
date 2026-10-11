<script setup lang="ts">
import { ROUTES } from "@/types";
import type { TRowAction } from "@/types";

definePage({ meta: { title: "Reconcile trip", roles: ["cashier", "owner"] } });

const customerStore = useCustomerStore();
const productStore = useProductStore();

const route = useRoute<"/cashier/trips/[id]/reconcile">();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const summary = tripSummary(route.params.id);

const tripsHomeRoute = computed(() => (authStore.activeRole === "owner" ? ROUTES.OWNER.TRIPS : ROUTES.CASHIER.TRIPS.INDEX));

const hasVariance = computed(() => summary.fullVariance !== 0 || summary.emptyVariance !== 0 || summary.cashVariance !== 0);

const suggestedShortageCash = computed(() => Math.max(0, -summary.cashVariance));
const shortageSheetOpen = ref(false);
const initialShortageContainers = Math.max(0, -summary.fullVariance);

const voidSheetOpen = ref(false);
const voidTargetSummary = ref("");

const productColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "product", label: "Product" },
  { key: "full", label: "Full" },
  { key: "empty", label: "Empty" },
];

const productRows = summary.perProduct.map((line) => ({ ...line, product: productStore.productName(line.productId) }));

const deliveryColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "customer", label: "Customer" },
  { key: "delivered", label: "Delivered", align: "right" },
  { key: "amount", label: "Amount", align: "right" },
];

const deliveryRows = summary.deliveries.map((delivery) => ({ ...delivery, customer: customerStore.customerName(delivery.customerId) }));

function openVoid(delivery: (typeof summary.deliveries)[number]) {
  voidTargetSummary.value = `Delivery to ${customerStore.customerName(delivery.customerId)}, ${delivery.delivered} delivered, ${formatMoney(delivery.amount)}`;
  voidSheetOpen.value = true;
}

function reconcile() {
  toast.show("Saved");
  router.push(tripsHomeRoute.value);
}

function deliveryActions(delivery: (typeof deliveryRows)[number]): TRowAction[] {
  return [{ label: "Request void", variant: "ghost", onSelect: () => openVoid(delivery) }];
}
</script>

<template>
  <UiEmptyState v-if="!summary.trip" title="Trip not found" description="It may not exist.">
    <template #action>
      <UiButton :to="tripsHomeRoute">Back to trips</UiButton>
    </template>
  </UiEmptyState>

  <div v-else class="flex flex-col gap-4">
    <UiPageHeader title="Reconcile trip" :subtitle="`Loaded ${formatDateTime(summary.trip.loadedAt)}`" :back="tripsHomeRoute">
      <template #actions>
        <UiStatusPill :tone="TRIP_STATUS_TONE[summary.trip.status]">{{ TRIP_STATUS_LABEL[summary.trip.status] }}</UiStatusPill>
        <UiButton v-if="summary.trip.status !== 'reconciled'" @click="reconcile">Reconcile</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable :columns="productColumns" :rows="productRows" :row-key="(row) => row.productId">
      <template #cell-full="{ row }">
        <UiVariancePill :value="row.fullVariance" />
      </template>
      <template #cell-empty="{ row }">
        <UiVariancePill :value="row.emptyVariance" />
      </template>
    </UiDataTable>

    <UiCard title="Cash">
      <div class="flex items-center justify-between">
        <span class="text-sm text-zinc-500">Expected <UiMoneyText :centavos="summary.expectedCash" size="sm" /></span>
        <UiVariancePill :value="summary.cashVariance" is-money />
      </div>
    </UiCard>

    <UiDataTable :row-actions="deliveryActions" title="Deliveries" :columns="deliveryColumns" :rows="deliveryRows" :row-key="(row) => row.id">
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
</template>
