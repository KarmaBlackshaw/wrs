<script setup lang="ts">
import { IconClipboardText } from "@/components";
import { listDigestDays } from "@/services/report";

definePage({ meta: { title: "Daily digest" } });

const today = todayIso();
const selectedDate = useRouteQuery("day", today, { mode: "push" });

const { data: days, isLoading, error, reload } = useResource((signal) => listDigestDays({}, signal));

const {
  data: dayRows,
  error: dayError,
  reload: reloadDay,
} = useResource((signal) => listDigestDays({ from: selectedDate.value, to: selectedDate.value }, signal), { watch: selectedDate });

const pastDays = computed(() => [...(days.value ?? [])].reverse());
const selectedDay = computed(() => dayRows.value?.[0]);

const columns = [
  { key: "date", label: "Date" },
  { key: "salesCash", label: "Cash", align: "right" as const },
  { key: "salesCredit", label: "Credit", align: "right" as const },
  { key: "variances", label: "Variance" },
];

function statTone(value: number) {
  return value !== 0 ? "warn" : "default";
}

function selectDay(day: { date: string }) {
  selectedDate.value = day.date;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
      <UiDataTable
        clickable
        title="Daily digest"
        :icon="IconClipboardText"
        :columns="columns"
        :rows="pastDays"
        :is-loading="isLoading"
        :error="error?.message"
        :row-key="(row) => row.date"
        :active-key="selectedDate"
        @row-click="selectDay"
        @retry="reload"
      >
        <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
        <template #cell-salesCash="{ row }">
          <UiMoneyText :centavos="row.salesCash" size="sm" />
        </template>
        <template #cell-salesCredit="{ row }">
          <UiMoneyText :centavos="row.salesCredit" size="sm" />
        </template>
        <template #cell-variances="{ row }">
          <UiStatusPill v-if="row.variances !== 0" tone="warn">Variance</UiStatusPill>
        </template>
        <template #empty>
          <UiEmptyState title="No digest days yet" />
        </template>
      </UiDataTable>

      <div class="flex min-w-0 flex-col gap-3">
        <UiField v-model="selectedDate" class="sm:w-48" label="Day" type="date" :max="today" />
        <UiCard v-if="selectedDay" :title="formatDate(selectedDay.date)">
          <div class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 2xl:grid-cols-4">
            <UiStatCard label="Cash sales">
              <UiMoneyText :centavos="selectedDay.salesCash" size="lg" />
            </UiStatCard>
            <UiStatCard label="Credit sales">
              <UiMoneyText :centavos="selectedDay.salesCredit" size="lg" />
            </UiStatCard>
            <UiStatCard label="Collections">
              <UiMoneyText :centavos="selectedDay.collections" size="lg" />
            </UiStatCard>
            <UiStatCard label="Expenses">
              <UiMoneyText :centavos="selectedDay.expenses" size="lg" />
            </UiStatCard>
            <UiStatCard label="Variances" :tone="statTone(selectedDay.variances)">
              <UiMoneyText :centavos="selectedDay.variances" size="lg" :tone="statTone(selectedDay.variances)" />
            </UiStatCard>
            <UiStatCard label="Low stock" :tone="statTone(selectedDay.lowStockCount)">{{ selectedDay.lowStockCount }}</UiStatCard>
            <UiStatCard label="Maintenance due" :tone="statTone(selectedDay.maintenanceDueCount)">{{ selectedDay.maintenanceDueCount }}</UiStatCard>
            <UiStatCard label="Tests due" :tone="statTone(selectedDay.testsDueCount)">{{ selectedDay.testsDueCount }}</UiStatCard>
          </div>
        </UiCard>
        <UiEmptyState v-else-if="dayError" title="Couldn't load" :description="dayError.message">
          <template #action><UiButton variant="secondary" @click="reloadDay">Retry</UiButton></template>
        </UiEmptyState>
        <UiEmptyState v-else-if="dayRows" title="No digest for that day" description="Pick another day from the list." />
      </div>
    </div>
  </div>
</template>
