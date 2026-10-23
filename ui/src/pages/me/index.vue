<script setup lang="ts">
import { loans } from "@/mocks/loans";
import { payLines, payRuns } from "@/mocks/payroll";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Me" } });

const authStore = useAuthStore();
const router = useRouter();

function payRunFor(runId: string) {
  return payRuns.find((run) => run.id === runId) ?? null;
}

const myPayLines = computed(() => payLines.filter((line) => line.employeeId === authStore.me?.id && payRunFor(line.runId)?.status === "finalized"));
const myLoans = computed(() => loans.filter((loan) => loan.employeeId === authStore.me?.id));

function payLineTitle(runId: string) {
  const period = payRunFor(runId);

  return period ? formatPeriod(period.periodStart, period.periodEnd) : runId;
}

const payslipColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "period", label: "Period" },
  { key: "net", label: "Net pay", align: "right" },
];

const payslipRows = computed(() => myPayLines.value.map((line) => ({ ...line, period: payLineTitle(line.runId) })));

const loanColumns: { key: string; label: string; align?: "left" | "right" }[] = [
  { key: "type", label: "Type" },
  { key: "term", label: "Term" },
  { key: "principal", label: "Principal", align: "right" },
  { key: "status", label: "Status" },
];

const loanRows = computed(() =>
  myLoans.value.map((loan) => ({ ...loan, type: loan.type === "advance" ? "Advance" : "Loan", term: `${loan.termMonths} month(s)` }))
);

const sheetOpen = ref(false);
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Me" :subtitle="authStore.meName">
      <template #actions>
        <UiButton @click="sheetOpen = true">Request advance or loan</UiButton>
      </template>
    </UiPageHeader>

    <UiDataTable
      clickable
      title="Payslips"
      :columns="payslipColumns"
      :rows="payslipRows"
      :row-key="(row) => row.runId"
      @row-click="(row) => router.push(ROUTES.ME.PAYSLIP(row.runId))"
    >
      <template #cell-net="{ row }">
        <UiMoneyText :centavos="row.net" />
      </template>
      <template #empty>
        <UiEmptyState title="No payslips yet" description="Payslips appear here once a payroll run is finalized." />
      </template>
    </UiDataTable>

    <UiDataTable title="Loans and advances" :columns="loanColumns" :rows="loanRows" :row-key="(row) => row.id">
      <template #cell-principal="{ row }">
        <UiMoneyText :centavos="row.principal" />
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="LOAN_STATUS_TONE[row.status]">{{ LOAN_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No loans or advances" description="Request an advance or loan to see it here." />
      </template>
    </UiDataTable>

    <LoanRequestSheet v-model:open="sheetOpen" />
  </div>
</template>
