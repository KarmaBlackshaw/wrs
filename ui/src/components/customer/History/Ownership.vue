<script setup lang="ts">
import type { TCustomerOwnership } from "@wrs/contract/customer";

import { listCustomerOwnerships } from "@/services/customer";

const { customerId } = defineProps<{ customerId: string }>();

const { page, clampTo, data, rows, isLoading, error, reload } = useCustomerHistory(
  ({ customerId, page, signal }) => listCustomerOwnerships({ id: customerId, query: { page }, signal }),
  { customerId: () => customerId, pageKey: "ownershipPage" }
);

const columns = [
  { key: "event", label: "Event" },
  { key: "rider", label: "Rider" },
  { key: "by", label: "By" },
  { key: "date", label: "Date" },
];

function riderLabel(row: TCustomerOwnership) {
  return row.riderName ?? "Open";
}
</script>

<template>
  <UiDataTable
    title="Ownership history"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.id"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    @retry="reload"
  >
    <template #cell-event="{ row }">{{ OWNERSHIP_EVENT_LABEL[row.event] }}</template>
    <template #cell-rider="{ row }">{{ riderLabel(row) }}</template>
    <template #cell-by="{ row }">{{ row.byName }}</template>
    <template #cell-date="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #empty>
      <UiEmptyState title="No ownership history yet" />
    </template>
    <template v-if="data != null" #footer>
      <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
