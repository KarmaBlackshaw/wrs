<script setup lang="ts">
import { IconWallet } from "@/components";
import { listDrawerSessions } from "@/services/drawer";
import { listEmployeeOptions } from "@/services/employee";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Cash sessions" } });

const PAGE_SIZE = 20;

const columns = [
  { key: "cashier", label: "Cashier" },
  { key: "opened", label: "Opened" },
  { key: "opening", label: "Opening", align: "right" as const },
  { key: "expected", label: "Expected", align: "right" as const },
  { key: "counted", label: "Counted", align: "right" as const },
  { key: "variance", label: "Variance", align: "right" as const },
];

const from = useRouteQuery("from", toManila(Date.now()).subtract(29, "day").format("YYYY-MM-DD"), { mode: "push" });
const to = useRouteQuery("to", todayIso(), { mode: "push" });
const cashierId = useRouteQuery("cashierId", "", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([from, to, cashierId]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listDrawerSessions(
      {
        from: from.value || undefined,
        to: to.value || undefined,
        cashierId: cashierId.value || undefined,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [from, to, cashierId, page] }
);

const rows = computed(() => data.value?.items ?? []);

const cashiers = useResource((signal) => listEmployeeOptions({ role: "cashier" }, signal));

const cashierFilterOptions = computed(() => [
  { value: "", label: "All cashiers" },
  ...(cashiers.data.value ?? []).map(({ id, name }) => ({ value: id, label: name })),
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="Money"
      :icon="IconWallet"
      :tabs="OWNER_TABS.MONEY"
      :columns="columns"
      :rows="rows"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.id"
      @retry="reload"
    >
      <template #actions>
        <UiField v-model="from" label="From" type="date" />
        <UiField v-model="to" label="To" type="date" />
        <UiSelect v-model="cashierId" label="Cashier" :options="cashierFilterOptions" />
      </template>
      <template #cell-cashier="{ row }">{{ row.cashierName }}</template>
      <template #cell-opened="{ row }">{{ formatDateTime(row.openedAt) }}</template>
      <template #cell-opening="{ row }"><UiMoneyText :centavos="row.openingCash" /></template>
      <template #cell-expected="{ row }"><UiMoneyText :centavos="row.expectedCash" tone="muted" /></template>
      <template #cell-counted="{ row }">
        <UiMoneyText v-if="row.countedCash != null" :centavos="row.countedCash" />
        <span v-else class="text-sm text-zinc-400">Open</span>
      </template>
      <template #cell-variance="{ row }">
        <UiMoneyText v-if="row.variance != null" :centavos="row.variance" :tone="row.variance === 0 ? 'ok' : 'danger'" />
        <span v-else class="text-sm text-zinc-400">-</span>
      </template>
      <template #empty>
        <UiEmptyState title="No cash sessions match" />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
      </template>
    </UiDataTable>
  </div>
</template>
