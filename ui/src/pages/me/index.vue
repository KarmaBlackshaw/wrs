<script setup lang="ts">
import type { TLoan } from "@wrs/contract/loan";

import { getMeSummary } from "@/services/me";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Me" } });

const authStore = useAuthStore();
const router = useRouter();

const { data, isLoading, error, reload } = useResource((signal) => getMeSummary(signal));

const payslips = computed(() => data.value?.payslips ?? []);
const loans = computed(() => data.value?.loans ?? []);

const payslipColumns = [
  { key: "period", label: "Period" },
  { key: "net", label: "Net pay", align: "right" as const },
];

const loanColumns = [
  { key: "type", label: "Type" },
  { key: "principal", label: "Principal", align: "right" as const },
  { key: "balance", label: "Balance", align: "right" as const },
  { key: "nextInstallment", label: "Next installment" },
  { key: "status", label: "Status" },
];

const isSheetOpen = ref(false);

function hasBalance({ status }: TLoan) {
  return status === "released" || status === "paid";
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Me" :subtitle="authStore.meName">
      <template #actions>
        <UiButton @click="isSheetOpen = true">Request advance or loan</UiButton>
      </template>
    </UiPageHeader>

    <UiStatCard v-if="data != null" label="Paid time off" :hint="`${data.pto.used} of ${data.pto.allowance} days used in ${data.pto.year}`">
      {{ data.pto.remaining }} days left
    </UiStatCard>

    <UiDataTable
      clickable
      title="Payslips"
      :columns="payslipColumns"
      :rows="payslips"
      :row-key="(row) => row.runId"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
      @row-click="(row) => router.push(ROUTES.ME.PAYSLIP(row.runId))"
    >
      <template #cell-period="{ row }">{{ formatPeriod(row.periodStart, row.periodEnd) }}</template>
      <template #cell-net="{ row }">
        <UiMoneyText :centavos="row.net" />
      </template>
      <template #empty>
        <UiEmptyState title="No payslips yet" description="Payslips appear here once a payroll run is finalized." />
      </template>
    </UiDataTable>

    <UiDataTable
      title="Loans and advances"
      :columns="loanColumns"
      :rows="loans"
      :row-key="(row) => row.id"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #cell-type="{ row }">
        {{ LOAN_TYPE_LABEL[row.type] }}
        <span v-if="row.termMonths != null" class="block text-sm text-zinc-500">{{ row.termMonths }} month(s)</span>
      </template>
      <template #cell-principal="{ row }">
        <UiMoneyText :centavos="row.principal" />
      </template>
      <template #cell-balance="{ row }">
        <UiMoneyText v-if="hasBalance(row)" :centavos="row.balance" />
        <template v-else>—</template>
      </template>
      <template #cell-nextInstallment="{ row }">
        <template v-if="row.nextInstallment != null">
          {{ formatDate(row.nextInstallment.due) }}
          <UiMoneyText :centavos="row.nextInstallment.principalPart + row.nextInstallment.interestPart" size="sm" tone="muted" />
        </template>
        <template v-else>—</template>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="LOAN_STATUS_TONE[row.status]">{{ LOAN_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No loans or advances" description="Request an advance or loan to see it here." />
      </template>
    </UiDataTable>

    <LoanRequestSheet v-model:open="isSheetOpen" @submit="reload" />
  </div>
</template>
