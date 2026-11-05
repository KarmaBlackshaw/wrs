<script setup lang="ts">
import type { TApprovalOf, TApprovalStatus } from "@wrs/contract/approval";

import { IconCheck, IconUserCircle } from "@/components";
import { APPROVAL_DECISION_COLUMNS } from "@/constants/approval";
import { approveCustomer } from "@/services/customer";
import { approveWaiverRequest, rejectWaiverRequest } from "@/services/waiverRequest";
import { ROUTES, type TRowAction, type TTableColumn } from "@/types";

type TCustomerApproval = TApprovalOf<"customers">;

const { status } = defineProps<{ status: TApprovalStatus }>();

const pendingColumns: TTableColumn[] = [
  { key: "request", label: "Request" },
  { key: "customer", label: "Customer" },
  { key: "phone", label: "Phone" },
  { key: "requestedByName", label: "Requested by" },
  { key: "createdAt", label: "Date" },
];

const handledColumns: TTableColumn[] = [{ key: "request", label: "Request" }, { key: "customer", label: "Customer" }, ...APPROVAL_DECISION_COLUMNS];

const { page, clampTo, isPaged, data, rows, isLoading, error, reload } = useApprovalList("customers", () => status);
const decision = useApprovalDecision(reload);
const { columns, isPending } = useApprovalColumns(() => status, { pending: pendingColumns, handled: handledColumns });

const emptyTitle = computed(() => (isPending.value ? "No pending customer requests" : "No handled customer requests yet"));

function requestLabel(row: TCustomerApproval) {
  switch (row.kind) {
    case "customer":
      return "New customer";
    case "waiver":
      return "Deposit waiver";
  }
}

function customerName(row: TCustomerApproval) {
  switch (row.kind) {
    case "customer":
      return fullName(row.item);
    case "waiver":
      return row.item.customerName;
  }
}

function phone(row: TCustomerApproval) {
  switch (row.kind) {
    case "customer":
      return row.item.phone;
    case "waiver":
      return "-";
  }
}

function customerId(row: TCustomerApproval) {
  switch (row.kind) {
    case "customer":
      return row.item.id;
    case "waiver":
      return row.item.customerId;
  }
}

function rowKey(row: TCustomerApproval) {
  return `${row.kind}:${row.id}`;
}

function pendingActions(row: TCustomerApproval): TRowAction[] {
  switch (row.kind) {
    case "customer": {
      const { id } = row.item;
      const name = fullName(row.item);

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            decision.confirmThen(
              { title: `Approve ${name}?`, message: "They become an active customer.", confirmLabel: "Approve" },
              () => approveCustomer(id),
              "Approved"
            ),
        },
      ];
    }
    case "waiver": {
      const { id } = row.item;
      const name = row.item.customerName;

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            decision.confirmThen(
              { title: `Waive deposits for ${name}?`, message: "Their deliveries will no longer collect container deposits.", confirmLabel: "Approve" },
              () => approveWaiverRequest(id),
              "Approved"
            ),
        },
        decision.reasonAction({
          title: "Reject waiver",
          confirmLabel: "Reject",
          successMessage: "Rejected",
          submit: (reason) => rejectWaiverRequest({ id, body: { reason } }),
        }),
      ];
    }
  }
}

function rowActions(row: TCustomerApproval) {
  const id = customerId(row);
  const actions: TRowAction[] = [{ label: "View customer", icon: IconUserCircle, to: ROUTES.OWNER.CUSTOMERS.DETAIL(id) }];

  return row.status === "pending" ? [...actions, ...pendingActions(row)] : actions;
}
</script>

<template>
  <UiPanelSection :title="APPROVAL_CATEGORY_LABEL.customers">
    <UiDataTable
      bare
      :columns="columns"
      :rows="rows"
      :is-loading="isLoading"
      :error="error?.message"
      :row-actions="rowActions"
      :row-label="customerName"
      :row-key="rowKey"
      @retry="reload"
    >
      <template #cell-compact="{ row }">
        <span class="block">{{ customerName(row) }}</span>
        <span v-if="isPending" class="block max-w-56 text-sm whitespace-normal text-zinc-500"
          >{{ requestLabel(row) }} · {{ formatDateTime(row.createdAt) }}</span
        >
        <ApprovalDecidedBy v-else :decision="row.decision" :decided-by-name="row.decidedByName" />
      </template>
      <template #cell-request="{ row }">{{ requestLabel(row) }}</template>
      <template #cell-customer="{ row }">{{ customerName(row) }}</template>
      <template #cell-phone="{ row }">{{ phone(row) }}</template>
      <template #cell-requestedByName="{ row }">{{ row.requestedByName || "-" }}</template>
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
  </UiPanelSection>
</template>
