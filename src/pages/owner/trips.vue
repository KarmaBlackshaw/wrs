<script setup lang="ts">
import { IconTruck } from "@/components";
import { trips } from "@/mocks/trips";
import { ROUTES } from "@/types";
import type { TTripRow } from "@/types";

definePage({ meta: { title: "Trips" } });

const employeeStore = useEmployeeStore();

const router = useRouter();

const columns = [
  { key: "id", label: "Trip" },
  { key: "rider", label: "Rider" },
  { key: "status", label: "Status" },
  { key: "cash", label: "Cash remitted vs expected", align: "right" as const },
  { key: "containerVariance", label: "Container variance", align: "right" as const },
];

const rows = computed(() =>
  trips.map((trip): TTripRow => {
    const summary = tripSummary(trip.id);

    return {
      id: trip.id,
      status: trip.status,
      loadedAt: trip.loadedAt,
      riderName: employeeStore.employeeName(trip.riderId),
      cashVariance: trip.status === "open" ? null : summary.cashVariance,
      containerVariance: summary.perProduct.length === 0 ? null : summary.fullVariance,
    };
  })
);

function openTrip(row: TTripRow) {
  router.push(ROUTES.CASHIER.TRIPS.RECONCILE(row.id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable clickable title="Trips" :icon="IconTruck" :columns="columns" :rows="rows" :row-key="(row) => row.id" @row-click="openTrip">
      <template #cell-id="{ row }">Trip {{ row.id }} · {{ formatDate(row.loadedAt) }}</template>
      <template #cell-rider="{ row }">{{ row.riderName }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="TRIP_STATUS_TONE[row.status]">{{ TRIP_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-cash="{ row }">
        <span v-if="row.cashVariance === null" class="text-zinc-400">-</span>
        <UiMoneyText v-else :centavos="row.cashVariance" :tone="row.cashVariance === 0 ? 'default' : 'danger'" />
      </template>
      <template #cell-containerVariance="{ row }">
        <span v-if="row.containerVariance === null" class="text-zinc-400">-</span>
        <span v-else class="tabular-nums" :class="row.containerVariance === 0 ? '' : 'font-semibold text-red-700'">
          {{ row.containerVariance }}
        </span>
      </template>
      <template #empty>
        <UiEmptyState title="No trips yet" />
      </template>
    </UiDataTable>
  </div>
</template>
