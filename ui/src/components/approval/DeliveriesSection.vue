<script setup lang="ts">
import type { TApprovalOf, TApprovalStatus } from "@wrs/contract/approval";

import { IconCheck } from "@/components";
import { APPROVAL_DECISION_COLUMNS } from "@/constants/approval";
import { acceptSyncConflict, voidSyncConflict } from "@/services/syncConflict";
import { approveVoid, rejectVoid } from "@/services/void";
import type { TRowAction, TTableColumn } from "@/types";

type TDeliveryApproval = TApprovalOf<"deliveries">;

const { status } = defineProps<{ status: TApprovalStatus }>();

const { page, clampTo, isPaged, data, rows, isLoading, error, reload } = useApprovalList("deliveries", () => status);
const decision = useApprovalDecision(reload);

const requestColumn: TTableColumn = { key: "request", label: "Request" };
const summaryColumn: TTableColumn = { key: "summary", label: "Summary" };
const amountColumn: TTableColumn = { key: "amount", label: "Amount", align: "right" };
const issueColumn: TTableColumn = { key: "issue", label: "Issue" };
const createdAtColumn: TTableColumn = { key: "createdAt", label: "Date" };

const pendingColumns: TTableColumn[] = [
  requestColumn,
  summaryColumn,
  amountColumn,
  { key: "requestedByName", label: "Requested by" },
  issueColumn,
  createdAtColumn,
];

const handledColumns: TTableColumn[] = [requestColumn, ...APPROVAL_DECISION_COLUMNS, summaryColumn, amountColumn];

const { columns, isPending } = useApprovalColumns(() => status, { pending: pendingColumns, handled: handledColumns });

const emptyTitle = computed(() => (isPending.value ? "No pending voids or sync conflicts" : "No handled voids or sync conflicts yet"));

function rowKey(row: TDeliveryApproval) {
  return `${row.kind}:${row.id}`;
}

function requestLabel(row: TDeliveryApproval) {
  switch (row.kind) {
    case "void":
      return `Void ${VOID_SOURCE_LABEL[row.item.refType]}`;
    case "sync_conflict":
      return SYNC_OP_KIND_LABEL[row.item.opKind];
  }
}

function compactTitle(row: TDeliveryApproval) {
  switch (row.kind) {
    case "void":
      return `${requestLabel(row)} · ${formatMoney(row.item.amount)}`;
    case "sync_conflict":
      return requestLabel(row);
  }
}

function amountText(row: TDeliveryApproval) {
  switch (row.kind) {
    case "void":
      return formatMoney(row.item.amount);
    case "sync_conflict":
      return "-";
  }
}

function issueText(row: TDeliveryApproval) {
  switch (row.kind) {
    case "void":
      return row.item.reason;
    case "sync_conflict":
      return row.item.codes.map((code) => SYNC_CONFLICT_CODE_LABEL[code] ?? code).join(", ");
  }
}

function pendingActions(row: TDeliveryApproval): TRowAction[] {
  switch (row.kind) {
    case "void": {
      const { id } = row.item;

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            decision.confirmThen(
              { title: "Approve void?", message: "This reverses the sale, its containers, deposits, stock and cash.", confirmLabel: "Approve void" },
              () => approveVoid(id),
              "Void approved"
            ),
        },
        decision.reasonAction({
          title: "Reject void",
          confirmLabel: "Reject",
          successMessage: "Rejected",
          submit: (reason) => rejectVoid({ id, body: { reason } }),
        }),
      ];
    }
    case "sync_conflict": {
      const { conflictId, opKind, refId, canVoid } = row.item;
      const actions: TRowAction[] = [];

      if (refId != null) {
        actions.push({
          label: "Accept",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            decision.confirmThen(
              { title: "Keep what the rider recorded?", message: row.item.summary, confirmLabel: "Accept" },
              () => acceptSyncConflict(conflictId),
              "Kept"
            ),
        });
      }

      if (canVoid) {
        actions.push(
          decision.reasonAction({
            title: `Void recorded ${SYNC_OP_KIND_LABEL[opKind].toLowerCase()}`,
            confirmLabel: "Void",
            successMessage: "Voided",
            submit: (reason) => voidSyncConflict({ id: conflictId, body: { reason } }),
          })
        );
      }

      return actions;
    }
  }
}

const rowActions = computed(() => (isPending.value ? pendingActions : undefined));
</script>

<template>
  <UiPanelSection :title="APPROVAL_CATEGORY_LABEL.deliveries">
    <UiDataTable
      bare
      :columns="columns"
      :rows="rows"
      :is-loading="isLoading"
      :error="error?.message"
      :row-actions="rowActions"
      :row-label="requestLabel"
      :row-key="rowKey"
      @retry="reload"
    >
      <template #cell-compact="{ row }">
        <span class="block">{{ compactTitle(row) }}</span>
        <span v-if="isPending" class="block max-w-56 text-sm whitespace-normal text-zinc-500">{{ row.item.summary }}</span>
        <ApprovalDecidedBy v-else :decision="row.decision" :decided-by-name="row.decidedByName" />
      </template>
      <template #cell-request="{ row }">{{ requestLabel(row) }}</template>
      <template #cell-summary="{ row }">
        <span class="block max-w-40 whitespace-normal">{{ row.item.summary }}</span>
      </template>
      <template #cell-amount="{ row }">{{ amountText(row) }}</template>
      <template #cell-requestedByName="{ row }">{{ row.requestedByName || "-" }}</template>
      <template #cell-issue="{ row }">
        <span class="block max-w-64 whitespace-normal">{{ issueText(row) }}</span>
      </template>
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
