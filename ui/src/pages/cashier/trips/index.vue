<script setup lang="ts">
import type { TTrip } from "@wrs/contract/trip";

import { IconTruck } from "@/components";
import { ROUTES, type TRowAction } from "@/types";

definePage({ meta: { title: "Trips" } });

const { status, riderId, from, to, page, clampTo, data, isLoading, error, reload, riderFilterOptions, pageSize } = useTripList();

const columns = [
  { key: "riderName", label: "Rider" },
  { key: "status", label: "Status" },
  { key: "loadedAt", label: "Loaded" },
  { key: "expectedCash", label: "Expected", align: "right" as const },
  { key: "remitted", label: "Remitted", align: "right" as const },
];

function tripActions({ id, status }: TTrip): TRowAction[] {
  if (status === "returning") {
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
    <UiDataTable
      title="Trips"
      :icon="IconTruck"
      :columns="columns"
      :rows="data?.items ?? []"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.id"
      :row-actions="tripActions"
      @retry="reload"
    >
      <template #actions>
        <UiSelect v-model="status" label="Status" :options="TRIP_STATUS_FILTER_OPTIONS" />
        <UiSelect v-model="riderId" label="Rider" :options="riderFilterOptions" />
        <UiField v-model="from" label="From" type="date" />
        <UiField v-model="to" label="To" type="date" />
        <UiButton :to="ROUTES.CASHIER.TRIPS.NEW">New load-out</UiButton>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="TRIP_STATUS_TONE[row.status]">{{ TRIP_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-loadedAt="{ row }">{{ formatDateTime(row.loadedAt) }}</template>
      <template #cell-expectedCash="{ row }">
        <UiMoneyText :centavos="row.expectedCash" />
      </template>
      <template #cell-remitted="{ row }">
        <UiMoneyText v-if="row.cashRemitted != null" :centavos="row.cashRemitted" />
        <span v-else class="text-zinc-400">-</span>
      </template>
      <template #empty>
        <UiEmptyState title="No trips yet" description="Start a new load-out to send a rider out." />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>
  </div>
</template>
