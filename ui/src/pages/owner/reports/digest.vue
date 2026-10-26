<script setup lang="ts">
import { IconClipboardText } from "@/components";
import { digestDays } from "@/mocks/digest";

definePage({ meta: { title: "Daily digest" } });

const selectedDate = ref(digestDays.at(-1)?.date ?? "");

const pastDays = computed(() => [...digestDays].reverse());
const selectedDay = computed(() => digestDays.find((day) => day.date === selectedDate.value));

const columns = [
  { key: "date", label: "Date" },
  { key: "salesCash", label: "Cash", align: "right" as const },
  { key: "salesCredit", label: "Credit", align: "right" as const },
  { key: "variances", label: "Variance" },
];

function statTone(count: number) {
  return count > 0 ? "warn" : "default";
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
        :row-key="(row) => row.date"
        :active-key="selectedDate"
        @row-click="selectDay"
      >
        <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
        <template #cell-salesCash="{ row }">
          <UiMoneyText :centavos="row.salesCash" size="sm" />
        </template>
        <template #cell-salesCredit="{ row }">
          <UiMoneyText :centavos="row.salesCredit" size="sm" />
        </template>
        <template #cell-variances="{ row }">
          <UiStatusPill v-if="row.variances > 0" tone="warn">Variance</UiStatusPill>
        </template>
        <template #empty>
          <UiEmptyState title="No digest days yet" />
        </template>
      </UiDataTable>

      <UiCard v-if="selectedDay" :title="formatDate(selectedDay.date)">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <UiMoneyText :centavos="selectedDay.variances" size="lg" :tone="selectedDay.variances > 0 ? 'warn' : 'default'" />
          </UiStatCard>
          <UiStatCard label="Low stock" :tone="statTone(selectedDay.lowStockCount)">{{ selectedDay.lowStockCount }}</UiStatCard>
          <UiStatCard label="Maintenance due" :tone="statTone(selectedDay.maintenanceDueCount)">{{ selectedDay.maintenanceDueCount }}</UiStatCard>
          <UiStatCard label="Tests due" :tone="statTone(selectedDay.testsDueCount)">{{ selectedDay.testsDueCount }}</UiStatCard>
        </div>
      </UiCard>
      <UiEmptyState v-else title="No digest for that day" description="Pick another day from the list." />
    </div>
  </div>
</template>
