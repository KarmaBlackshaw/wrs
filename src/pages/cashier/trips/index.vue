<script setup lang="ts">
import { IconTruck } from "@/components";
import { trips } from "@/mocks/trips";
import { ROUTES, type TRowAction, type TTrip } from "@/types";

definePage({ meta: { title: "Trips" } });

const employeeStore = useEmployeeStore();

const columns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "riderName", label: "Rider" },
  { key: "status", label: "Status" },
  { key: "loadedAt", label: "Loaded" },
  { key: "remitted", label: "Remitted", align: "right" },
];

const rows = computed(() => trips.map((trip) => ({ ...trip, riderName: employeeStore.employeeName(trip.riderId) })));

function tripActions({ id, status }: TTrip): TRowAction[] {
  if (status === "open") {
    return [{ label: "Receive", to: ROUTES.CASHIER.TRIPS.RECEIVE(id) }];
  }

  if (status === "returned") {
    return [{ label: "Reconcile", to: ROUTES.CASHIER.TRIPS.RECONCILE(id) }];
  }

  return [{ label: "View", variant: "ghost", to: ROUTES.CASHIER.TRIPS.RECONCILE(id) }];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable :row-actions="tripActions" title="Trips" :icon="IconTruck" :columns="columns" :rows="rows" :row-key="(row) => row.id">
      <template #actions>
        <UiButton :to="ROUTES.CASHIER.TRIPS.NEW">New load-out</UiButton>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="TRIP_STATUS_TONE[row.status]">{{ TRIP_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-loadedAt="{ row }">{{ formatDateTime(row.loadedAt) }}</template>
      <template #cell-remitted="{ row }">
        <UiMoneyText v-if="row.cashRemitted != null" :centavos="row.cashRemitted" />
      </template>
      <template #empty>
        <UiEmptyState title="No trips yet" description="Start a new load-out to send a rider out." />
      </template>
    </UiDataTable>
  </div>
</template>
