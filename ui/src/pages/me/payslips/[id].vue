<script setup lang="ts">
import { getMyPayslip } from "@/services/me";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Payslip" } });

const route = useRoute();

const runId = computed(() => String(route.params.id));

const { data: payslip, error, reload } = useResource((signal) => getMyPayslip(runId.value, signal), { watch: [runId] });

const deductionColumns = [
  { key: "kind", label: "Deduction" },
  { key: "amount", label: "Amount", align: "right" as const },
];

const subtitle = computed(() => (payslip.value ? formatPeriod(payslip.value.periodStart, payslip.value.periodEnd) : undefined));

const isUnavailable = computed(() => error.value?.code === "payroll.run_not_finalized" || error.value?.status === 404);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Payslip" :subtitle :back="ROUTES.ME.INDEX" />

    <UiEmptyState v-if="isUnavailable" title="Payslip not available" description="This payslip isn't available yet." />

    <UiEmptyState v-else-if="error != null" title="Couldn't load" :description="error.message">
      <template #action>
        <UiButton variant="secondary" @click="reload">Retry</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="payslip != null">
      <UiCard>
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Base</span>
            <UiMoneyText :centavos="payslip.base" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Incentive</span>
            <UiMoneyText :centavos="payslip.incentive" tone="ok" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Adjustments</span>
            <UiMoneyText :centavos="payslip.adjustmentsTotal" />
          </div>
          <div v-for="adjustment in payslip.adjustments" :key="adjustment.id" class="flex items-center justify-between pl-3 text-sm text-zinc-500">
            <span>{{ adjustment.reason }}</span>
            <UiMoneyText :centavos="adjustment.amount" size="sm" tone="muted" />
          </div>
          <div class="flex items-center justify-between border-t border-zinc-200 pt-3">
            <span class="text-base font-medium text-zinc-700">Gross</span>
            <UiMoneyText :centavos="payslip.gross" />
          </div>
        </div>
      </UiCard>

      <div class="flex flex-col gap-2">
        <UiDataTable title="Deductions" :columns="deductionColumns" :rows="payslip.deductions" :row-key="(row) => `${row.kind}-${row.refId}`">
          <template #cell-kind="{ row }">
            {{ DEDUCTION_LABEL[row.kind] }}
            <span v-if="row.note != null" class="block text-sm text-zinc-500">{{ row.note }}</span>
          </template>
          <template #cell-amount="{ row }">
            <UiMoneyText :centavos="row.amount" tone="danger" />
          </template>
          <template #empty>
            <UiEmptyState title="No deductions" />
          </template>
        </UiDataTable>
        <div v-if="payslip.deductions.length > 0" class="flex items-center justify-between px-1">
          <span class="text-base font-medium text-zinc-700">Total deductions</span>
          <UiMoneyText :centavos="payslip.deductionsTotal" tone="danger" />
        </div>
      </div>

      <UiCard>
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Credit held</span>
            <UiMoneyText :centavos="payslip.creditHeld" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Carried over to next run</span>
            <UiMoneyText :centavos="payslip.carriedOver" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Paid leave days</span>
            <span class="text-base text-zinc-900">{{ payslip.paidLeaveDays }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-base text-zinc-500">Unpaid leave days</span>
            <span class="text-base text-zinc-900">{{ payslip.unpaidLeaveDays }}</span>
          </div>
        </div>
      </UiCard>

      <UiCard v-if="payslip.creditPayback > 0">
        <div class="flex items-center justify-between">
          <span class="text-base text-zinc-500">Credit paid back</span>
          <UiMoneyText :centavos="payslip.creditPayback" tone="ok" />
        </div>
      </UiCard>

      <UiCard>
        <div class="flex items-center justify-between">
          <span class="text-lg font-semibold text-zinc-900">Net pay</span>
          <UiMoneyText :centavos="payslip.net" size="xl" tone="ok" />
        </div>
      </UiCard>
    </template>
  </div>
</template>
