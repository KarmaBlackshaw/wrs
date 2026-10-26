<script setup lang="ts">
import { listMovements } from "@/services/container";

const { customerId } = defineProps<{ customerId: string }>();

const { page, clampTo, data, rows, isLoading, error, reload } = useCustomerHistory(
  ({ customerId, page, signal }) => listMovements({ customerId, page }, signal),
  { customerId: () => customerId, pageKey: "movementsPage" }
);

const columns = [
  { key: "date", label: "Date" },
  { key: "type", label: "Type" },
  { key: "container", label: "Container" },
  { key: "qty", label: "Qty" },
  { key: "route", label: "From → To" },
  { key: "by", label: "By" },
];
</script>

<template>
  <UiDataTable
    title="Container movements"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.id"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    @retry="reload"
  >
    <template #cell-date="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #cell-type="{ row }">{{ MOVEMENT_TYPE_LABEL[row.type] }}</template>
    <template #cell-container="{ row }">{{ CONTAINER_TYPE_LABEL[row.containerType] }} ({{ row.full ? "full" : "empty" }})</template>
    <template #cell-qty="{ row }">{{ row.qty }}</template>
    <template #cell-route="{ row }">{{ row.fromLabel }} → {{ row.toLabel }}</template>
    <template #cell-by="{ row }">{{ row.createdByName }}</template>
    <template #empty>
      <UiEmptyState title="No container movements yet" />
    </template>
    <template v-if="data != null" #footer>
      <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
