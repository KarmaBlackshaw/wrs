<script setup lang="ts">
import { IconReceipt } from "@/components";
import { walkInSales } from "@/mocks/walkInSales";
import { deliveries } from "@/mocks/trips";
import { voids } from "@/mocks/voids";
import type { TOption, TPaymentType, TRowAction, TSaleRow } from "@/types";

definePage({ meta: { title: "Sales" } });

const customerStore = useCustomerStore();
const productStore = useProductStore();

const columns = [
  { key: "createdAt", label: "Date" },
  { key: "source", label: "Source" },
  { key: "customerName", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", align: "right" as const },
  { key: "paymentType", label: "Payment" },
  { key: "status", label: "Status" },
];

const dateFilter = ref("");
const paymentFilter = ref<"all" | TPaymentType>("all");
const sourceFilter = ref<"all" | "walk_in" | "delivery">("all");
const paymentOptions = [{ value: "all", label: "All" }, ...PAYMENT_OPTIONS];

const sourceOptions: TOption<typeof sourceFilter.value>[] = [
  { value: "all", label: "All" },
  { value: "walk_in", label: SALE_SOURCE_LABEL.walk_in },
  { value: "delivery", label: SALE_SOURCE_LABEL.delivery },
];

function saleCustomerName(customerId?: string) {
  return customerId ? customerStore.customerName(customerId) : "Walk-in";
}

const allRows = computed(() => {
  const walkInRows = walkInSales.map((sale): TSaleRow => ({
    id: sale.id,
    source: "walk_in",
    createdAt: sale.createdAt,
    customerName: saleCustomerName(sale.customerId),
    items: sale.lines.map((line) => `${line.qty}× ${productStore.productName(line.productId)}`).join(", "),
    amount: sale.amount,
    paymentType: sale.paymentType,
  }));

  const deliveryRows = deliveries.map((delivery): TSaleRow => ({
    id: delivery.id,
    source: "delivery",
    createdAt: delivery.createdAt,
    customerName: saleCustomerName(delivery.customerId),
    items: `${delivery.delivered}× ${productStore.productName(delivery.productId)}`,
    amount: delivery.amount,
    paymentType: delivery.paymentType,
  }));

  return [...walkInRows, ...deliveryRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

const filteredRows = computed(() =>
  allRows.value.filter((row) => {
    if (dateFilter.value && !row.createdAt.startsWith(dateFilter.value)) {
      return false;
    }

    if (paymentFilter.value !== "all" && row.paymentType !== paymentFilter.value) {
      return false;
    }

    if (sourceFilter.value !== "all" && row.source !== sourceFilter.value) {
      return false;
    }

    return true;
  })
);

function voidStatus(saleId: string) {
  return voids.find((entry) => entry.refId === saleId)?.status;
}

const voidSheetOpen = ref(false);
const voidSummary = ref("");

function openVoid(row: TSaleRow) {
  voidSummary.value = `${row.source === "walk_in" ? "Walk-in sale" : "Delivery"}, ${row.customerName}, ${formatMoney(row.amount)}`;
  voidSheetOpen.value = true;
}

function saleActions(row: TSaleRow): TRowAction[] {
  const status = voidStatus(row.id);

  return status === "approved" || status === "pending" ? [] : [{ label: "Void", onSelect: () => openVoid(row) }];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable :row-actions="saleActions" title="Sales" :icon="IconReceipt" :columns="columns" :rows="filteredRows" :row-key="(row) => row.id">
      <template #filters>
        <UiFilterChip label="Date" :value="dateFilter && formatDate(dateFilter)" @clear="dateFilter = ''">
          <UiField v-model="dateFilter" label="Date" type="date" />
        </UiFilterChip>
        <UiFilterChip label="Payment" :value="paymentFilter === 'all' ? undefined : PAYMENT_LABEL[paymentFilter]" @clear="paymentFilter = 'all'">
          <UiSegmentedControl v-model="paymentFilter" :options="paymentOptions" />
        </UiFilterChip>
        <UiFilterChip label="Source" :value="sourceFilter === 'all' ? undefined : SALE_SOURCE_LABEL[sourceFilter]" @clear="sourceFilter = 'all'">
          <UiSegmentedControl v-model="sourceFilter" :options="sourceOptions" />
        </UiFilterChip>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-source="{ row }">{{ SALE_SOURCE_LABEL[row.source] }}</template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.amount" />
      </template>
      <template #cell-paymentType="{ row }">{{ PAYMENT_LABEL[row.paymentType] }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="voidStatus(row.id) === 'approved'" tone="danger">Voided</UiStatusPill>
        <UiStatusPill v-else-if="voidStatus(row.id) === 'pending'" tone="warn">Void pending</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No sales match these filters" />
      </template>
    </UiDataTable>

    <VoidRequestSheet v-model:open="voidSheetOpen" :summary="voidSummary" />
  </div>
</template>
