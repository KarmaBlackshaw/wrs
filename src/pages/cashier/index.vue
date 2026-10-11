<script setup lang="ts">
import { drawerSessions } from "@/mocks/drawerSessions";
import { walkInSales } from "@/mocks/walkInSales";
import { payments } from "@/mocks/payments";
import { trips } from "@/mocks/trips";
import { expenses } from "@/mocks/expenses";
import { ROUTES, type TLocalExpense, type TReportColumn } from "@/types";

definePage({ meta: { title: "Drawer" } });

const latestSession = drawerSessions.at(-1) ?? null;
const sessionDay = latestSession ? new Date(latestSession.openedAt) : new Date();

const isOpen = ref(latestSession != null && latestSession.closedAt == null);
const openingCash = ref(latestSession?.openingCash ?? 0);

const localExpenses = ref<TLocalExpense[]>([]);

const expenseColumns: TReportColumn[] = [
  { key: "category", label: "Category" },
  { key: "note", label: "Note" },
  { key: "amount", label: "Amount", align: "right" },
];

const openSheetOpen = ref(false);
const expenseSheetOpen = ref(false);
const closeSheetOpen = ref(false);

const suggestedOpeningCash = latestSession?.openingCash ?? 0;

const walkInCash = computed(() =>
  walkInSales.filter((sale) => sale.paymentType === "cash" && isSameManilaDay(sale.createdAt, sessionDay)).reduce((sum, sale) => sum + sale.amount, 0)
);

const collections = computed(() =>
  payments.filter((payment) => payment.source === "drawer" && isSameManilaDay(payment.createdAt, sessionDay)).reduce((sum, payment) => sum + payment.amount, 0)
);

const riderRemittances = computed(() =>
  trips.filter((trip) => trip.returnedAt && isSameManilaDay(trip.returnedAt, sessionDay)).reduce((sum, trip) => sum + (trip.cashRemitted ?? 0), 0)
);

const seededExpenses = computed(() =>
  expenses.filter((expense) => expense.source === "drawer" && isSameManilaDay(expense.date, sessionDay)).reduce((sum, expense) => sum + expense.amount, 0)
);

const localExpenseTotal = computed(() => localExpenses.value.reduce((sum, expense) => sum + expense.amount, 0));

const drawerExpensesTotal = computed(() => seededExpenses.value + localExpenseTotal.value);

const expectedCash = computed(() => openingCash.value + walkInCash.value + collections.value + riderRemittances.value - drawerExpensesTotal.value);

function confirmOpen(cash: number) {
  openingCash.value = cash;
  isOpen.value = true;
}

function confirmExpense(expense: Omit<TLocalExpense, "id">) {
  localExpenses.value.push({ id: `local-exp-${Date.now()}`, ...expense });
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Drawer session" :subtitle="isOpen ? `Opened ${formatDateTime(latestSession?.openedAt ?? sessionDay)}` : 'Drawer is closed'">
      <template #actions>
        <UiStatusPill :tone="isOpen ? 'ok' : 'neutral'">{{ isOpen ? "Open" : "Closed" }}</UiStatusPill>
        <template v-if="isOpen">
          <UiButton variant="secondary" :to="ROUTES.CASHIER.COLLECT">Collect payment</UiButton>
          <UiButton variant="secondary" :to="ROUTES.CASHIER.RETURN_CONTAINER">Return container</UiButton>
          <UiButton variant="secondary" @click="expenseSheetOpen = true">Record expense</UiButton>
          <UiButton @click="closeSheetOpen = true">Close with count</UiButton>
        </template>
      </template>
    </UiPageHeader>

    <template v-if="isOpen">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <UiStatCard label="Opening cash"><UiMoneyText :centavos="openingCash" size="lg" /></UiStatCard>
        <UiStatCard label="Walk-in cash"><UiMoneyText :centavos="walkInCash" size="lg" /></UiStatCard>
        <UiStatCard label="Collections"><UiMoneyText :centavos="collections" size="lg" /></UiStatCard>
        <UiStatCard label="Rider remittances"><UiMoneyText :centavos="riderRemittances" size="lg" /></UiStatCard>
        <UiStatCard label="Drawer expenses" tone="warn"><UiMoneyText :centavos="drawerExpensesTotal" size="lg" tone="warn" /></UiStatCard>
        <UiStatCard label="Expected cash"><UiMoneyText :centavos="expectedCash" size="lg" /></UiStatCard>
      </div>

      <UiDataTable title="Drawer expenses this session" :columns="expenseColumns" :rows="localExpenses" :row-key="(row) => row.id">
        <template #cell-amount="{ row }">
          <UiMoneyText :centavos="row.amount" />
        </template>
        <template #empty>
          <p class="p-4 text-base text-zinc-500">None recorded yet.</p>
        </template>
      </UiDataTable>
    </template>

    <UiEmptyState v-else title="Drawer is closed" description="Open the drawer with a starting cash count to begin the day.">
      <template #action>
        <UiButton @click="openSheetOpen = true">Open drawer</UiButton>
      </template>
    </UiEmptyState>

    <DrawerOpenSheet v-model:open="openSheetOpen" :suggested-opening-cash="suggestedOpeningCash" @submit="confirmOpen" />
    <DrawerExpenseSheet v-model:open="expenseSheetOpen" @submit="confirmExpense" />
    <DrawerCloseSheet v-model:open="closeSheetOpen" :expected-cash="expectedCash" @submit="isOpen = false" />
  </div>
</template>
