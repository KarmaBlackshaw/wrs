<script setup lang="ts">
import type { TPaymentType, TSaleRow, TSaleSource } from "@wrs/contract/sale";

import { IconReceipt } from "@/components";
import { listSales } from "@/services/sale";
import type { TOption, TRowAction } from "@/types";

definePage({ meta: { title: "Sales" } });

type TPaymentFilter = "all" | TPaymentType;
type TSourceFilter = "all" | TSaleSource;

const PAGE_SIZE = 20;

const columns = [
  { key: "createdAt", label: "Date" },
  { key: "source", label: "Source" },
  { key: "customerName", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "amount", label: "Amount", align: "right" as const },
  { key: "paymentType", label: "Payment" },
  { key: "status", label: "Status" },
];

const from = useRouteQuery("from", "", { mode: "push" });
const to = useRouteQuery("to", "", { mode: "push" });
const paymentType = useRouteQuery<TPaymentFilter>("paymentType", "all", { mode: "push" });
const source = useRouteQuery<TSourceFilter>("source", "all", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([from, to, paymentType, source]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listSales(
      {
        from: from.value || undefined,
        to: to.value || undefined,
        paymentType: paymentType.value === "all" ? undefined : paymentType.value,
        source: source.value === "all" ? undefined : source.value,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [from, to, paymentType, source, page] }
);

const paymentOptions: TOption<TPaymentFilter>[] = [{ value: "all", label: "All" }, ...PAYMENT_OPTIONS];

const sourceOptions: TOption<TSourceFilter>[] = [
  { value: "all", label: "All" },
  { value: "walk_in", label: SALE_SOURCE_LABEL.walk_in },
  { value: "delivery", label: SALE_SOURCE_LABEL.delivery },
];

const paymentChipValue = computed(() => (paymentType.value === "all" ? undefined : PAYMENT_LABEL[paymentType.value]));
const sourceChipValue = computed(() => (source.value === "all" ? undefined : SALE_SOURCE_LABEL[source.value]));

function itemsText({ lines }: TSaleRow) {
  return lines.map(({ qty, productName }) => `${qty}× ${productName}`).join(", ");
}

const voidSheetOpen = ref(false);
const voidSummary = ref("");

function openVoid(row: TSaleRow) {
  voidSummary.value = `${SALE_SOURCE_LABEL[row.source]} sale, ${row.customerName ?? "Walk-in"}, ${formatMoney(row.amount)}`;
  voidSheetOpen.value = true;
}

function saleActions(row: TSaleRow): TRowAction[] {
  return row.voidStatus === "none" ? [{ label: "Void", onSelect: () => openVoid(row) }] : [];
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="Sales"
      :icon="IconReceipt"
      :columns="columns"
      :rows="data?.items ?? []"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-actions="saleActions"
      :row-key="(row) => row.id"
      @retry="reload"
    >
      <template #filters>
        <UiFilterChip label="From" :value="from && formatDate(from)" @clear="from = ''">
          <UiField v-model="from" label="From" type="date" />
        </UiFilterChip>
        <UiFilterChip label="To" :value="to && formatDate(to)" @clear="to = ''">
          <UiField v-model="to" label="To" type="date" />
        </UiFilterChip>
        <UiFilterChip label="Payment" :value="paymentChipValue" @clear="paymentType = 'all'">
          <UiSegmentedControl v-model="paymentType" :options="paymentOptions" />
        </UiFilterChip>
        <UiFilterChip label="Source" :value="sourceChipValue" @clear="source = 'all'">
          <UiSegmentedControl v-model="source" :options="sourceOptions" />
        </UiFilterChip>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-source="{ row }">{{ SALE_SOURCE_LABEL[row.source] }}</template>
      <template #cell-customerName="{ row }">{{ row.customerName ?? "Walk-in" }}</template>
      <template #cell-items="{ row }">{{ itemsText(row) }}</template>
      <template #cell-amount="{ row }">
        <UiMoneyText :centavos="row.amount" />
      </template>
      <template #cell-paymentType="{ row }">{{ PAYMENT_LABEL[row.paymentType] }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="row.voidStatus === 'voided'" tone="danger">Voided</UiStatusPill>
        <UiStatusPill v-else-if="row.voidStatus === 'pending'" tone="warn">Void pending</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No sales match these filters" />
      </template>
      <template #footer>
        <div v-if="data != null" class="flex flex-col gap-3">
          <div class="flex items-center justify-between text-sm font-medium text-zinc-700">
            <span>{{ data.totals.count }} sales</span>
            <UiMoneyText :centavos="data.totals.amount" />
          </div>
          <UiPagination v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
        </div>
      </template>
    </UiDataTable>

    <VoidRequestSheet v-model:open="voidSheetOpen" :summary="voidSummary" />
  </div>
</template>
