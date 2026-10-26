<script setup lang="ts">
import type { TDelivery } from "@wrs/contract/trip";

import { listDeliveries } from "@/services/delivery";

const { customerId } = defineProps<{ customerId: string }>();

const { page, clampTo, data, rows, isLoading, error, reload } = useCustomerHistory(
  ({ customerId, page, signal }) => listDeliveries({ customerId, page }, signal),
  { customerId: () => customerId, pageKey: "deliveriesPage" }
);

const columns = [
  { key: "date", label: "Date" },
  { key: "rider", label: "Rider" },
  { key: "products", label: "Products" },
  { key: "amount", label: "Amount" },
  { key: "payment", label: "Payment" },
  { key: "status", label: "Status" },
];

function productsLabel(row: TDelivery) {
  return row.lines.map(({ qty, productName }) => `${qty} × ${productName}`).join(", ");
}
</script>

<template>
  <UiDataTable
    title="Delivery history"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.id"
    :total="data?.total"
    :is-loading="isLoading"
    :error="error?.message"
    @retry="reload"
  >
    <template #cell-date="{ row }">{{ formatDateTime(row.createdAt) }}</template>
    <template #cell-rider="{ row }">{{ row.riderName }}</template>
    <template #cell-products="{ row }">{{ productsLabel(row) }}</template>
    <template #cell-amount="{ row }"><UiMoneyText :centavos="row.amount" /></template>
    <template #cell-payment="{ row }">{{ PAYMENT_LABEL[row.paymentType] }}</template>
    <template #cell-status="{ row }">
      <UiStatusPill :tone="row.voidedAt != null ? 'danger' : 'ok'">{{ row.voidedAt != null ? "Voided" : "Delivered" }}</UiStatusPill>
    </template>
    <template #empty>
      <UiEmptyState title="No deliveries yet" />
    </template>
    <template v-if="data != null" #footer>
      <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
    </template>
  </UiDataTable>
</template>
