<script setup lang="ts">
import { IconUsers } from "@/components";
import { customers } from "@/mocks/customers";
import { ROUTES, type TCustomer } from "@/types";

definePage({ meta: { title: "Today's trip" } });

const openTrip = useOpenTrip();
const summary = computed(() => (openTrip.value ? tripSummary(openTrip.value.id) : null));

function deliveryFor(customerId: string) {
  return summary.value?.deliveries.find((delivery) => delivery.customerId === customerId);
}

const columns = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status", align: "right" as const },
];

const router = useRouter();

function deliverTo(customer: TCustomer) {
  if (!openTrip.value || deliveryFor(customer.id)) {
    return;
  }

  router.push(ROUTES.RIDER.DELIVER(openTrip.value.id, customer.id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Today's trip" :subtitle="openTrip ? `Trip ${openTrip.id}` : undefined">
      <template #actions>
        <UiButton v-if="openTrip" :to="ROUTES.RIDER.TRIP_RETURN(openTrip.id)">End trip</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!openTrip || !summary" title="No open trip" description="Ask your cashier to load out a trip to get started." />

    <template v-else>
      <div class="grid grid-cols-3 gap-3">
        <UiStatCard label="Loaded">{{ summary.loaded }}</UiStatCard>
        <UiStatCard label="Delivered" tone="ok">{{ summary.delivered }}</UiStatCard>
        <UiStatCard label="Left" :tone="summary.expectedFull === 0 ? 'ok' : 'default'">{{ summary.expectedFull }}</UiStatCard>
      </div>

      <UiDataTable clickable title="Customers" :icon="IconUsers" :columns="columns" :rows="customers" :row-key="(row) => row.id" @row-click="deliverTo">
        <template #cell-status="{ row }">
          <UiStatusPill v-if="deliveryFor(row.id)" tone="ok">Delivered</UiStatusPill>
          <span v-else class="text-sm font-medium text-brand-700">Deliver</span>
        </template>
      </UiDataTable>
    </template>
  </div>
</template>
