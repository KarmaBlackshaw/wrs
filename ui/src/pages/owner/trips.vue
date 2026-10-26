<script setup lang="ts">
import type { TTrip } from "@wrs/contract/trip";

import { IconTruck } from "@/components";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Trips" } });

const router = useRouter();
const { status, riderId, from, to, page, clampTo, data, isLoading, error, reload, riderFilterOptions, pageSize } = useTripList();

const columns = [
  { key: "rider", label: "Rider" },
  { key: "expectedCash", label: "Expected cash", align: "right" as const },
  { key: "cashRemitted", label: "Remitted", align: "right" as const },
  { key: "cashVariance", label: "Variance", align: "right" as const },
];

function openTrip({ id }: TTrip) {
  router.push(ROUTES.CASHIER.TRIPS.RECONCILE(id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      clickable
      title="Trips"
      :icon="IconTruck"
      :columns="columns"
      :rows="data?.items ?? []"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.id"
      @row-click="openTrip"
      @retry="reload"
    >
      <template #actions>
        <UiSelect v-model="status" label="Status" :options="TRIP_STATUS_FILTER_OPTIONS" />
        <UiSelect v-model="riderId" label="Rider" :options="riderFilterOptions" />
        <UiField v-model="from" label="From" type="date" />
        <UiField v-model="to" label="To" type="date" />
      </template>
      <template #cell-rider="{ row }">
        <div class="flex flex-col items-start gap-1">
          <span class="font-medium">{{ row.riderName }}</span>
          <span class="text-xs text-zinc-500">{{ formatDateTime(row.loadedAt) }}</span>
          <UiStatusPill :tone="TRIP_STATUS_TONE[row.status]">{{ TRIP_STATUS_LABEL[row.status] }}</UiStatusPill>
        </div>
      </template>
      <template #cell-expectedCash="{ row }">
        <UiMoneyText :centavos="row.expectedCash" />
      </template>
      <template #cell-cashRemitted="{ row }">
        <UiMoneyText v-if="row.cashRemitted != null" :centavos="row.cashRemitted" />
        <span v-else class="text-zinc-400">-</span>
      </template>
      <template #cell-cashVariance="{ row }">
        <UiMoneyText v-if="row.cashVariance != null" :centavos="row.cashVariance" :tone="row.cashVariance === 0 ? 'default' : 'danger'" />
        <span v-else class="text-zinc-400">-</span>
      </template>
      <template #empty>
        <UiEmptyState title="No trips match" />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>
  </div>
</template>
