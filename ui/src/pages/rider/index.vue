<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";
import { dueStatus } from "@wrs/contract/rules/dueStatus";

import { IconUsers } from "@/components";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Today's trip" } });

const riderStore = useRiderStore();
const { trip, myCustomers, isHydrated } = storeToRefs(riderStore);
const router = useRouter();
const today = todayIso();

const isOpen = computed(() => trip.value?.status === "open");
const loaded = computed(() => trip.value?.lines.reduce((sum, { loaded: qty }) => sum + qty, 0) ?? 0);
const delivered = computed(() => trip.value?.lines.reduce((sum, { delivered: qty }) => sum + qty, 0) ?? 0);
const left = computed(() => trip.value?.lines.reduce((sum, { expectedFull }) => sum + expectedFull, 0) ?? 0);

const deliveredIds = computed(() => new Set(trip.value?.deliveries.filter(({ voidedAt }) => voidedAt == null).map(({ customerId }) => customerId)));

const columns = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status", align: "right" as const },
];

function dueOf(customer: TCustomer) {
  return dueStatus(customer, today);
}

function deliverTo({ id }: TCustomer) {
  if (trip.value == null || !isOpen.value || deliveredIds.value.has(id)) {
    return;
  }

  router.push(ROUTES.RIDER.DELIVER(trip.value.id, id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Today's trip" :subtitle="trip != null ? `Trip ${trip.id}` : undefined">
      <template #actions>
        <UiButton v-if="trip != null && isOpen" :to="ROUTES.RIDER.TRIP_RETURN(trip.id)">End trip</UiButton>
        <UiButton v-else-if="trip != null" variant="secondary" :to="ROUTES.RIDER.TRIP_RETURN(trip.id)">Return summary</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!isHydrated" title="Loading" description="Reading your saved trip." />

    <UiEmptyState v-else-if="trip == null" title="No open trip" description="Ask your cashier to load out a trip to get started." />

    <template v-else>
      <UiEmptyState v-if="!isOpen" title="Trip ended" description="Hand the empties, unsold stock and cash to your cashier. Deliveries are locked." />

      <div class="grid grid-cols-3 gap-3">
        <UiStatCard label="Loaded">{{ loaded }}</UiStatCard>
        <UiStatCard label="Delivered" tone="ok">{{ delivered }}</UiStatCard>
        <UiStatCard label="Left" :tone="left === 0 ? 'ok' : 'default'">{{ left }}</UiStatCard>
      </div>

      <UiDataTable
        :clickable="isOpen"
        title="Customers"
        :icon="IconUsers"
        :columns="columns"
        :rows="myCustomers"
        :row-key="(row) => row.id"
        @row-click="deliverTo"
      >
        <template #cell-name="{ row }">{{ fullName(row) }}</template>
        <template #cell-status="{ row }">
          <span class="flex justify-end gap-1">
            <UiStatusPill v-if="dueOf(row) === 'due'" tone="warn">Due</UiStatusPill>
            <UiStatusPill v-else-if="dueOf(row) === 'overdue'" tone="danger">Overdue</UiStatusPill>
            <UiStatusPill v-if="deliveredIds.has(row.id)" tone="ok">Delivered</UiStatusPill>
            <span v-else-if="isOpen" class="text-sm font-medium text-brand-700">Deliver</span>
          </span>
        </template>
        <template #empty>
          <UiEmptyState title="No customers" description="Add a customer from the Customers tab." />
        </template>
      </UiDataTable>
    </template>
  </div>
</template>
