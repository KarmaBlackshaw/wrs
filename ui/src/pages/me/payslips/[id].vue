<script setup lang="ts">
import { payLines, payRuns } from "@/mocks/payroll";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Payslip" } });

const route = useRoute();
const authStore = useAuthStore();

const runId = computed(() => String(route.params.id));
const payLine = computed(() => payLines.find((line) => line.runId === runId.value && line.employeeId === authStore.user?.id) ?? null);
const payRun = computed(() => payRuns.find((run) => run.id === runId.value) ?? null);

const deductionColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "kind", label: "Deduction" },
  { key: "amount", label: "Amount", align: "right" },
];

const deductionRows = computed(
  () => payLine.value?.deductions.map((deduction, index) => ({ id: index, kind: DEDUCTION_LABEL[deduction.kind], amount: deduction.amount })) ?? []
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Payslip" :subtitle="payRun ? formatPeriod(payRun.periodStart, payRun.periodEnd) : undefined" :back="ROUTES.ME.INDEX" />

    <UiEmptyState v-if="!payLine" title="Payslip not found" description="This payslip isn't available." />

    <template v-else>
      <UiCard>
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Base</span>
            <UiMoneyText :centavos="payLine.base" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Incentive</span>
            <UiMoneyText :centavos="payLine.incentive" tone="ok" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Adjustments</span>
            <UiMoneyText :centavos="payLine.adjustments" />
          </div>
        </div>
      </UiCard>

      <div class="flex flex-col gap-2">
        <UiDataTable title="Deductions" :columns="deductionColumns" :rows="deductionRows" :row-key="(row) => row.id">
          <template #cell-amount="{ row }">
            <UiMoneyText :centavos="row.amount" tone="danger" />
          </template>
          <template #empty>
            <UiEmptyState title="No deductions" />
          </template>
        </UiDataTable>
        <div v-if="payLine.deductions.length > 0" class="flex items-center justify-between px-1">
          <span class="text-base font-medium text-zinc-700">Total deductions</span>
          <UiMoneyText :centavos="totalDeductions(payLine)" tone="danger" />
        </div>
      </div>

      <UiCard>
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold text-zinc-900">Net pay</span>
          <UiMoneyText :centavos="payLine.net" size="xl" tone="ok" />
        </div>
      </UiCard>
    </template>
  </div>
</template>
