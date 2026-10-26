<script setup lang="ts">
import type { TExpense } from "@wrs/contract/expense";

import { IconWallet } from "@/components";
import { deleteExpense, listExpenses } from "@/services/expense";
import { listConsumables } from "@/services/consumable";
import { OWNER_TABS, type TRowAction } from "@/types";

definePage({ meta: { title: "Expenses" } });

const PAGE_SIZE = 20;

const columns = [
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "paidBy", label: "Paid by" },
  { key: "amount", label: "Amount", align: "right" as const },
];

const expenseCategoryStore = useExpenseCategoryStore();
const { confirm } = useConfirm();
const fileDownload = useFileDownload();
const toast = useToast();
const { options: categoryOptions } = storeToRefs(expenseCategoryStore);

const month = useRouteQuery("month", toManila(Date.now()).format("YYYY-MM"), { mode: "push" });
const categoryId = useRouteQuery("categoryId", "", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([month, categoryId]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listExpenses(
      {
        month: month.value || undefined,
        categoryId: categoryId.value || undefined,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [month, categoryId, page] }
);

const consumables = useResource(listConsumables);

const { run: runDelete, error: deleteError } = useAction(deleteExpense);

expenseCategoryStore.load();

const rows = computed(() => data.value?.items ?? []);

function restockText({ consumableId, qty }: TExpense) {
  const unit = (consumables.data.value ?? []).find(({ id }) => id === consumableId)?.unit ?? "";

  return `restocked ${qty} ${unit}`.trim();
}

const categoryFilterOptions = computed(() => [{ value: "", label: "All categories" }, ...categoryOptions.value]);

const isSheetOpen = ref(false);
const editing = ref<TExpense>();

function openAdd() {
  editing.value = undefined;
  isSheetOpen.value = true;
}

function openEdit(row: TExpense) {
  editing.value = row;
  isSheetOpen.value = true;
}

async function remove(row: TExpense) {
  const isConfirmed = await confirm({
    title: "Delete expense?",
    message: `${row.categoryName}, ${formatMoney(row.amount)} on ${formatDate(row.date)}`,
  });

  if (!isConfirmed) {
    return;
  }

  await runDelete(row.id);

  if (deleteError.value != null) {
    return;
  }

  toast.show("Expense deleted");
  await reload();
}

function rowActions(row: TExpense): TRowAction[] {
  const actions: TRowAction[] = [
    { label: "Edit", onSelect: () => openEdit(row) },
    { label: "Delete", variant: "danger", onSelect: () => remove(row) },
  ];

  if (row.receiptFileId != null) {
    const { receiptFileId } = row;

    actions.unshift({ label: "Receipt", onSelect: () => fileDownload.open(receiptFileId) });
  }

  return actions;
}
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
      :row-actions="rowActions"
      @retry="reload"
    >
      <template #actions>
        <UiField v-model="month" label="Month" type="month" />
        <UiSelect v-model="categoryId" label="Category" :options="categoryFilterOptions" />
        <UiButton @click="openAdd">Add expense</UiButton>
      </template>
      <template #cell-category="{ row }">{{ row.categoryName }}</template>
      <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
      <template #cell-paidBy="{ row }">
        {{ row.paidByName }} · {{ EXPENSE_SOURCE_LABEL[row.source] }}
        <template v-if="row.consumableId">· {{ restockText(row) }}</template>
      </template>
      <template #cell-amount="{ row }"><UiMoneyText :centavos="row.amount" /></template>
      <template #empty>
        <UiEmptyState title="No expenses match" />
      </template>
      <template #footer>
        <div v-if="data != null" class="flex items-center justify-between gap-3 px-5 py-3 text-sm">
          <span class="text-zinc-500">Total</span>
          <UiMoneyText :centavos="data.totals.amount" />
        </div>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <ExpenseAddSheet v-model:open="isSheetOpen" v-model:expense="editing" @submit="reload" />
  </div>
</template>
