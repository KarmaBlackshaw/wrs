<script setup lang="ts">
import startCase from "lodash/startCase";

import { IconWallet } from "@/components";
import { expenses as expensesMock } from "@/mocks/expenses";
import { OWNER_TABS } from "@/types";
import type { TExpense } from "@/types";

definePage({ meta: { title: "Expenses" } });

const employeeStore = useEmployeeStore();

const expenses = ref<TExpense[]>([...expensesMock]);

const rowColumns = [
  { key: "category", label: "Category" },
  { key: "date", label: "Date" },
  { key: "paidBy", label: "Paid by" },
  { key: "amount", label: "Amount", align: "right" as const },
];

const monthKey = (date: string) => date.slice(0, 7);
const monthLabel = (key: string) => new Date(`${key}-01`).toLocaleDateString("en-PH", { month: "long", year: "numeric" });

const monthGroups = computed(() => {
  const months = new Map<string, TExpense[]>();

  for (const expense of [...expenses.value].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = monthKey(expense.date);
    const list = months.get(key) ?? [];
    list.push(expense);
    months.set(key, list);
  }

  return [...months.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, rows]) => {
      const categoryTotals = new Map<string, number>();

      for (const row of rows) {
        categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + row.amount);
      }

      return { key, rows, categoryTotals: [...categoryTotals.entries()], total: rows.reduce((sum, row) => sum + row.amount, 0) };
    });
});

const addOpen = ref(false);

function addExpense(expense: Omit<TExpense, "id">) {
  expenses.value.push({ id: `exp-${expenses.value.length + 1}`, ...expense });
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPanel title="Money" :icon="IconWallet" :count="expenses.length" :tabs="OWNER_TABS.MONEY">
      <template #actions>
        <UiButton @click="addOpen = true">Add expense</UiButton>
      </template>

      <UiPanelSection v-for="group in monthGroups" :key="group.key" :title="monthLabel(group.key)">
        <template #actions>
          <UiMoneyText :centavos="group.total" />
        </template>
        <dl class="flex flex-wrap gap-x-6 gap-y-1 px-5 pb-3 text-sm">
          <div v-for="[category, total] in group.categoryTotals" :key="category" class="flex items-center gap-2">
            <dt class="text-zinc-500">{{ category }}</dt>
            <dd><UiMoneyText :centavos="total" size="sm" /></dd>
          </div>
        </dl>
        <UiTable :columns="rowColumns" :rows="group.rows" :row-key="(row) => row.id">
          <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
          <template #cell-paidBy="{ row }">
            {{ employeeStore.employeeName(row.paidBy) }} · {{ startCase(row.source) }}
            <template v-if="row.consumableId">· restocked {{ row.qty }} pc</template>
          </template>
          <template #cell-amount="{ row }"><UiMoneyText :centavos="row.amount" /></template>
        </UiTable>
      </UiPanelSection>
    </UiPanel>

    <ExpenseAddSheet v-model:open="addOpen" @submit="addExpense" />
  </div>
</template>
