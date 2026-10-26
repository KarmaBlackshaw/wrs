<script setup lang="ts">
import { listPayments } from "@/services/payment";

const { customerId } = defineProps<{ customerId: string }>();

const { page, clampTo, data, rows, isLoading, error, reload } = useCustomerHistory(
  ({ customerId, page, signal }) => listPayments({ customerId, page }, signal),
  { customerId: () => customerId, pageKey: "paymentsPage" }
);

const columns = [
  { key: "date", label: "Date" },
  { key: "amount", label: "Amount" },
  { key: "method", label: "Method" },
  { key: "by", label: "Collected by" },
  { key: "status", label: "Status" },
];
</script>

<template>
  <UiDataTable
    title="Payment history"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.id"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    @retry="reload"
  >
    <template #cell-date="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #cell-amount="{ row }"><UiMoneyText :centavos="row.amount" /></template>
    <template #cell-method="{ row }">{{ PAYMENT_METHOD_LABEL[row.method] }}</template>
    <template #cell-by="{ row }">{{ row.byName }}</template>
    <template #cell-status="{ row }">
      <UiStatusPill :tone="row.voidedAt != null ? 'danger' : 'ok'">{{ row.voidedAt != null ? "Voided" : "Paid" }}</UiStatusPill>
    </template>
    <template #empty>
      <UiEmptyState title="No payments yet" />
    </template>
    <template v-if="data != null" #footer>
      <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
