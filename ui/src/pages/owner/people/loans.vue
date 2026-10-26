<script setup lang="ts">
import { IconIdentificationBadge } from "@/components";
import { installments, loans as loansMock } from "@/mocks/loans";
import { type TLoan, type TLoanRow, type TRowAction, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Loans" } });

const employeeStore = useEmployeeStore();

const toast = useToast();

const loans = ref<TLoan[]>([...loansMock]);

const columns = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "principal", label: "Principal", align: "right" as const },
  { key: "balance", label: "Balance", align: "right" as const },
];

const rows = computed(() =>
  loans.value.map((loan): TLoanRow => ({
    ...loan,
    employee: employeeStore.employeeName(loan.employeeId),
    balance: balance(loan),
  }))
);

function schedule(loanId: string) {
  return installments.filter((installment) => installment.loanId === loanId).sort((a, b) => a.seq - b.seq);
}

function balance(loan: TLoan) {
  const paid = schedule(loan.id)
    .filter((installment) => installment.paid)
    .reduce((sum, installment) => sum + installment.principalPart, 0);

  return loan.status === "released" || loan.status === "paid" ? Math.max(0, loan.principal - paid) : loan.principal;
}

const scheduleLoan = ref<TLoan>();
const scheduleInstallments = computed(() => (scheduleLoan.value ? schedule(scheduleLoan.value.id) : []));

function approve(loan: TLoan) {
  loan.status = "approved";
  toast.show("Saved");
}

const releaseLoan = ref<TLoan>();

function loanActions(loan: TLoan) {
  const actions: TRowAction[] = [];

  if (schedule(loan.id).length > 0) {
    actions.push({ label: "Schedule", variant: "ghost", onSelect: () => (scheduleLoan.value = loan) });
  }

  if (loan.status === "requested") {
    actions.push({ label: "Approve", onSelect: () => approve(loan) });
  }

  if (loan.status === "approved") {
    actions.push({ label: "Release", variant: "primary", onSelect: () => (releaseLoan.value = loan) });
  }

  return actions;
}

function releaseWithAuthorization(file: File) {
  if (!releaseLoan.value) {
    return;
  }

  releaseLoan.value.status = "released";
  releaseLoan.value.authorizationUrl = URL.createObjectURL(file);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="loanActions"
      title="People"
      :icon="IconIdentificationBadge"
      :tabs="OWNER_TABS.PEOPLE"
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.id"
    >
      <template #cell-type="{ row }">
        <UiStatusPill tone="neutral">{{ row.type }}</UiStatusPill>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="LOAN_STATUS_TONE[row.status]">{{ LOAN_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-principal="{ row }">
        <UiMoneyText :centavos="row.principal" size="sm" tone="muted" />
      </template>
      <template #cell-balance="{ row }">
        <UiMoneyText :centavos="row.balance" />
      </template>
      <template #empty>
        <UiEmptyState title="No loans yet" />
      </template>
    </UiDataTable>

    <LoanScheduleSheet v-model:loan="scheduleLoan" :installments="scheduleInstallments" />

    <LoanReleaseSheet v-model:loan="releaseLoan" @submit="releaseWithAuthorization" />
  </div>
</template>
