<script setup lang="ts">
import { listDeposits } from "@/services/deposit";

const { customerId } = defineProps<{ customerId: string }>();

const { page, clampTo, data, rows, isLoading, error, reload } = useCustomerHistory(
  ({ customerId, page, signal }) => listDeposits({ customerId, page }, signal),
  { customerId: () => customerId, pageKey: "depositsPage" }
);

const columns = [
  { key: "date", label: "Date" },
  { key: "kind", label: "Kind" },
  { key: "container", label: "Container" },
  { key: "qty", label: "Qty" },
  { key: "amount", label: "Amount" },
  { key: "by", label: "By" },
];
</script>

<template>
  <UiDataTable
    title="Deposit history"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.id"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    @retry="reload"
  >
    <template #cell-date="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #cell-kind="{ row }">{{ DEPOSIT_KIND_LABEL[row.kind] }}</template>
    <template #cell-container="{ row }">{{ CONTAINER_TYPE_LABEL[row.containerType] }}</template>
    <template #cell-qty="{ row }">{{ row.qty }}</template>
    <template #cell-amount="{ row }"><UiMoneyText :centavos="row.amount" /></template>
    <template #cell-by="{ row }">{{ row.byName }}</template>
    <template #empty>
      <UiEmptyState title="No deposits yet" />
    </template>
    <template v-if="data != null" #footer>
      <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
