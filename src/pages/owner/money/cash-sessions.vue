<script setup lang="ts">
import { IconWallet } from "@/components";
import { drawerSessions } from "@/mocks/drawerSessions";
import { expenses } from "@/mocks/expenses";
import { payments } from "@/mocks/payments";
import { walkInSales } from "@/mocks/walkInSales";
import type { TDrawerSession } from "@/types";
import { OWNER_TABS } from "@/types";

definePage({ meta: { title: "Cash sessions" } });

const employeeStore = useEmployeeStore();

const columns = [
  { key: "cashier", label: "Cashier" },
  { key: "opened", label: "Opened" },
  { key: "opening", label: "Opening", align: "right" as const },
  { key: "expected", label: "Expected", align: "right" as const },
  { key: "counted", label: "Counted", align: "right" as const },
  { key: "variance", label: "Variance", align: "right" as const },
];

function expectedCash(session: TDrawerSession) {
  const day = session.openedAt.slice(0, 10);

  const cashWalkIns = walkInSales
    .filter((sale) => sale.paymentType === "cash" && sale.createdAt.slice(0, 10) === day)
    .reduce((sum, sale) => sum + sale.amount, 0);

  const collections = payments
    .filter((payment) => payment.source === "drawer" && payment.createdAt.slice(0, 10) === day)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const drawerExpenses = expenses.filter((expense) => expense.source === "drawer" && expense.date === day).reduce((sum, expense) => sum + expense.amount, 0);

  return session.openingCash + cashWalkIns + collections - drawerExpenses;
}

const rows = computed(() =>
  [...drawerSessions]
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
    .map((session) => {
      const expected = expectedCash(session);

      return { session, expected, variance: session.countedCash === undefined ? null : session.countedCash - expected };
    })
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable title="Money" :icon="IconWallet" :tabs="OWNER_TABS.MONEY" :columns="columns" :rows="rows" :row-key="(row) => row.session.id">
      <template #cell-cashier="{ row }">{{ employeeStore.employeeName(row.session.cashierId) }}</template>
      <template #cell-opened="{ row }">{{ formatDateTime(row.session.openedAt) }}</template>
      <template #cell-opening="{ row }"><UiMoneyText :centavos="row.session.openingCash" /></template>
      <template #cell-expected="{ row }"><UiMoneyText :centavos="row.expected" tone="muted" /></template>
      <template #cell-counted="{ row }">
        <UiMoneyText v-if="row.session.countedCash !== undefined" :centavos="row.session.countedCash" />
        <span v-else class="text-sm text-zinc-400">Open</span>
      </template>
      <template #cell-variance="{ row }">
        <span v-if="row.variance === null" class="text-sm text-zinc-400">-</span>
        <UiMoneyText v-else :centavos="row.variance" :tone="row.variance === 0 ? 'ok' : 'danger'" />
      </template>
      <template #empty>
        <UiEmptyState title="No cash sessions yet" />
      </template>
    </UiDataTable>
  </div>
</template>
