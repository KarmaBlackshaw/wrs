<script setup lang="ts">
import type { TExpense } from "@wrs/contract/expense";
import { getCurrentDrawer } from "@/services/drawer";
import { ROUTES, type TReportColumn } from "@/types";

definePage({ meta: { title: "Drawer" } });

const expenseColumns: TReportColumn[] = [
  { key: "categoryName", label: "Category" },
  { key: "note", label: "Note" },
  { key: "amount", label: "Amount", align: "right" },
];

const { data: drawer, isLoading, error, reload } = useResource(getCurrentDrawer);

const openSheetOpen = ref(false);
const expenseSheetOpen = ref(false);
const closeSheetOpen = ref(false);

const isOpen = computed(() => drawer.value != null);
const subtitle = computed(() => (drawer.value != null ? `Opened ${formatDateTime(drawer.value.session.openedAt)}` : "Drawer is closed"));
const isDrawerReady = computed(() => drawer.value !== undefined);

const stats = computed(() => {
  const breakdown = drawer.value?.breakdown;

  if (breakdown == null) {
    return [];
  }

  return [
    { label: "Opening cash", centavos: breakdown.opening },
    { label: "Walk-in cash", centavos: breakdown.cashWalkIns },
    { label: "Deposits", centavos: breakdown.cashDeposits },
    { label: "Collections", centavos: breakdown.cashPayments },
    { label: "Rider remittances", centavos: breakdown.riderRemittances },
    { label: "Drawer expenses", centavos: breakdown.drawerExpenses, tone: "warn" as const },
    { label: "Deposit refunds", centavos: breakdown.depositRefunds, tone: "warn" as const },
    { label: "Void refunds", centavos: breakdown.voidRefunds, tone: "warn" as const },
    { label: "Expected cash", centavos: breakdown.expected },
  ];
});

function expenseKey(expense: TExpense) {
  return expense.id;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Drawer session" :subtitle="subtitle">
      <template #actions>
        <template v-if="isDrawerReady">
          <UiStatusPill :tone="isOpen ? 'ok' : 'neutral'">{{ isOpen ? "Open" : "Closed" }}</UiStatusPill>
          <template v-if="isOpen">
            <UiButton variant="secondary" :to="ROUTES.CASHIER.COLLECT">Collect payment</UiButton>
            <UiButton variant="secondary" :to="ROUTES.CASHIER.RETURN_CONTAINER">Return container</UiButton>
            <UiButton variant="secondary" @click="expenseSheetOpen = true">Record expense</UiButton>
            <UiButton @click="closeSheetOpen = true">Close with count</UiButton>
          </template>
        </template>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="error != null" title="Couldn't load" :description="error.message">
      <template #action>
        <UiButton variant="secondary" @click="reload">Retry</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="drawer != null">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
        <UiStatCard v-for="stat in stats" :key="stat.label" :label="stat.label" :tone="stat.tone">
          <UiMoneyText :centavos="stat.centavos" size="lg" :tone="stat.tone" />
        </UiStatCard>
      </div>

      <UiDataTable title="Drawer expenses this session" :columns="expenseColumns" :rows="drawer.expenses" :row-key="expenseKey" :is-loading="isLoading">
        <template #cell-amount="{ row }">
          <UiMoneyText :centavos="row.amount" />
        </template>
        <template #empty>
          <p class="p-4 text-base text-zinc-500">None recorded yet.</p>
        </template>
      </UiDataTable>
    </template>

    <UiEmptyState v-else-if="drawer === null" title="Drawer is closed" description="Open the drawer with a starting cash count to begin the day.">
      <template #action>
        <UiButton @click="openSheetOpen = true">Open drawer</UiButton>
      </template>
    </UiEmptyState>

    <DrawerOpenSheet v-model:open="openSheetOpen" @submit="reload" />
    <DrawerExpenseSheet v-model:open="expenseSheetOpen" @submit="reload" />
    <DrawerCloseSheet v-model:open="closeSheetOpen" :expected="drawer?.breakdown.expected ?? 0" @submit="reload" />
  </div>
</template>
