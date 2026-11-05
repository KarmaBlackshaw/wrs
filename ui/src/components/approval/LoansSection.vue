<script setup lang="ts">
import type { TApprovalOf, TApprovalStatus } from "@wrs/contract/approval";

import { IconCheck } from "@/components";
import { APPROVAL_DECISION_COLUMNS } from "@/constants/approval";
import { rejectLoan } from "@/services/loan";
import type { TRowAction, TTableColumn } from "@/types";

type TLoanApproval = TApprovalOf<"loans">;

const { status } = defineProps<{ status: TApprovalStatus }>();

const { page, clampTo, isPaged, data, rows, isLoading, error, reload } = useApprovalList("loans", () => status);
const decision = useApprovalDecision(reload);
const loanApproval = ref<TLoanApproval>();

const baseColumns: TTableColumn[] = [
  { key: "employee", label: "Employee" },
  { key: "type", label: "Type" },
  { key: "principal", label: "Principal", align: "right" },
];

const pendingColumns: TTableColumn[] = [
  ...baseColumns,
  { key: "interest", label: "Interest", align: "right" },
  { key: "installment", label: "Per pay run", align: "right" },
  { key: "createdAt", label: "Date" },
];

const handledColumns: TTableColumn[] = [...baseColumns, ...APPROVAL_DECISION_COLUMNS];

const { columns, isPending } = useApprovalColumns(() => status, { pending: pendingColumns, handled: handledColumns });

const emptyTitle = computed(() => (isPending.value ? "No pending loan requests" : "No handled loan requests yet"));

function rowKey(row: TLoanApproval) {
  return row.id;
}

function rowLabel(row: TLoanApproval) {
  return row.item.employeeName;
}

function pendingActions(row: TLoanApproval): TRowAction[] {
  const { id } = row.item;

  return [
    { label: "Approve & release", icon: IconCheck, variant: "primary", onSelect: () => (loanApproval.value = row) },
    decision.reasonAction({
      title: "Reject loan",
      confirmLabel: "Reject",
      successMessage: "Rejected",
      submit: (reason) => rejectLoan({ id, body: { reason } }),
    }),
  ];
}

const rowActions = computed(() => (isPending.value ? pendingActions : undefined));
</script>

<template>
  <UiPanelSection :title="APPROVAL_CATEGORY_LABEL.loans">
    <UiDataTable
      bare
      :columns="columns"
      :rows="rows"
      :is-loading="isLoading"
      :error="error?.message"
      :row-actions="rowActions"
      :row-label="rowLabel"
      :row-key="rowKey"
      @retry="reload"
    >
      <template #cell-compact="{ row }">
        <span class="block">{{ row.item.employeeName }} · {{ formatMoney(row.item.principal) }}</span>
        <span v-if="isPending" class="block max-w-56 text-sm whitespace-normal text-zinc-500"
          >{{ LOAN_TYPE_LABEL[row.item.type] }} · {{ formatDateTime(row.createdAt) }}</span
        >
        <ApprovalDecidedBy v-else :decision="row.decision" :decided-by-name="row.decidedByName" />
      </template>
      <template #cell-employee="{ row }">{{ row.item.employeeName }}</template>
      <template #cell-type="{ row }">{{ LOAN_TYPE_LABEL[row.item.type] }}</template>
      <template #cell-principal="{ row }">{{ formatMoney(row.item.principal) }}</template>
      <template #cell-interest="{ row }">{{ formatMoney(row.item.preview.totalInterest) }}</template>
      <template #cell-installment="{ row }">{{ formatMoney(row.item.preview.installment) }}</template>
      <template #cell-createdAt="{ row }">
        <span class="block">{{ formatDate(row.createdAt) }}</span>
        <span class="block text-sm text-zinc-500">{{ formatTime(row.createdAt) }}</span>
      </template>
      <template #cell-decision="{ row }">
        <ApprovalDecisionPill :decision="row.decision" />
      </template>
      <template #cell-decidedByName="{ row }">{{ row.decidedByName ?? "-" }}</template>
      <template #cell-decisionReason="{ row }">
        <ApprovalReasonCell :reason="row.decisionReason" />
      </template>
      <template #empty>
        <UiEmptyState :title="emptyTitle" />
      </template>
      <template v-if="isPaged" #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>
    <LoanApproveSheet v-model:approval="loanApproval" @submit="reload" />
  </UiPanelSection>
</template>
