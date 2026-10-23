<script setup lang="ts">
import { IconCheck, IconStamp, IconUserCircle, IconX } from "@/components";
import { approvals } from "@/mocks/approvals";
import { loans } from "@/mocks/loans";
import { ROUTES, type TApproval, type TLoan, type TRowAction } from "@/types";

definePage({ meta: { title: "Approvals" } });

const employeeStore = useEmployeeStore();
const customerStore = useCustomerStore();

const toast = useToast();
const confirmDialog = useConfirm();

const handled = ref<Record<string, "approved" | "rejected">>({});

const loanApproval = ref<TApproval>();

const columns = [
  { key: "summary", label: "Request" },
  { key: "requestedBy", label: "Requested by" },
  { key: "createdAt", label: "Date" },
  { key: "details", label: "Details" },
  { key: "status", label: "Status" },
];

function customerLink(refId: string) {
  return customerStore.findCustomer(refId) ? ROUTES.OWNER.CUSTOMERS.DETAIL(refId) : undefined;
}

function approvalActions(approval: TApproval) {
  const actions: TRowAction[] = [];
  const customer = approval.kind === "credit" || approval.kind === "waiver" ? customerLink(approval.refId) : undefined;

  if (customer) {
    actions.push({ label: "View customer", icon: IconUserCircle, to: customer });
  }

  if (!handled.value[approval.id]) {
    actions.push(
      { label: "Approve", icon: IconCheck, variant: "primary", onSelect: () => openConfirm(approval, "approve") },
      { label: "Reject", icon: IconX, variant: "danger", onSelect: () => openConfirm(approval, "reject") }
    );
  }

  return actions;
}

function loanFor(refId: string) {
  return loans.find((loan) => loan.id === refId);
}

function loanPreview(loan: TLoan) {
  const monthlyInterest = Math.round(loan.principal * (loan.ratePct / 100));
  const totalInterest = loan.method === "diminishing" ? Math.round((monthlyInterest * (loan.termMonths + 1)) / 2) : monthlyInterest * loan.termMonths;
  const installment = Math.round((loan.principal + totalInterest) / loan.termMonths);

  return { totalInterest, installment };
}

async function openConfirm(approval: TApproval, action: "approve" | "reject") {
  if (action === "approve" && approval.kind === "loan") {
    loanApproval.value = approval;

    return;
  }

  const isConfirmed = await confirmDialog.confirm({
    title: action === "approve" ? "Approve request" : "Reject request",
    message: `Are you sure you want to ${action} this request?`,
    variant: action === "reject" ? "danger" : "primary",
  });

  if (!isConfirmed) {
    return;
  }

  handled.value[approval.id] = action === "approve" ? "approved" : "rejected";
  toast.show(action === "approve" ? "Approved" : "Rejected");
}

function approveLoan(approval: TApproval) {
  handled.value[approval.id] = "approved";
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable :row-actions="approvalActions" title="Approvals" :icon="IconStamp" :columns="columns" :rows="approvals" :row-key="(row) => row.id">
      <template #cell-requestedBy="{ row }">{{ employeeStore.employeeName(row.requestedBy) }}</template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-details="{ row }">
        <div v-if="row.kind === 'loan' && loanFor(row.refId)" class="flex flex-col gap-0.5 text-sm text-zinc-600">
          <span>Interest: <UiMoneyText :centavos="loanPreview(loanFor(row.refId)!).totalInterest" size="sm" /></span>
          <span>Installment / pay run: <UiMoneyText :centavos="loanPreview(loanFor(row.refId)!).installment" size="sm" /></span>
        </div>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill v-if="handled[row.id]" :tone="handled[row.id] === 'approved' ? 'ok' : 'danger'">
          {{ handled[row.id] === "approved" ? "Approved" : "Rejected" }}
        </UiStatusPill>
        <UiStatusPill v-else tone="warn">Pending</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No pending approvals" />
      </template>
    </UiDataTable>

    <LoanApproveSheet v-model:approval="loanApproval" @submit="approveLoan" />
  </div>
</template>
