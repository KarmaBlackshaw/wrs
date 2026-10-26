<script setup lang="ts">
import type { TApproval, TApprovalStatus } from "@wrs/contract/approval";

import { IconCheck, IconStamp, IconUserCircle, IconX } from "@/components";
import { listApprovals } from "@/services/approval";
import { approveCustomer } from "@/services/customer";
import { rejectLoan } from "@/services/loan";
import { acceptSyncConflict, voidSyncConflict } from "@/services/syncConflict";
import { approveVoid, rejectVoid } from "@/services/void";
import { approveWaiverRequest, rejectWaiverRequest } from "@/services/waiverRequest";
import { OWNER_TABS, ROUTES, type TConfirmOptions, type TRowAction } from "@/types";

type TReasonTarget = { title: string; confirmLabel: string; successMessage: string; submit: (reason: string) => Promise<unknown> };

definePage({ meta: { title: "Approvals" } });

const pendingColumns = [
  { key: "request", label: "Request" },
  { key: "requestedByName", label: "Requested by" },
  { key: "createdAt", label: "Date" },
  { key: "details", label: "Details" },
];

const handledColumns = [
  { key: "request", label: "Request" },
  { key: "requestedByName", label: "Requested by" },
  { key: "createdAt", label: "Date" },
  { key: "decision", label: "Decision" },
  { key: "decidedByName", label: "Decided by" },
  { key: "decisionReason", label: "Reason" },
];

const narrowColumns = [{ key: "request", label: "Request" }];

const route = useRoute();
const toast = useToast();
const confirmDialog = useConfirm();
const isWide = useMediaQuery("(min-width: 640px)");

const status = computed((): TApprovalStatus => (route.path === ROUTES.OWNER.APPROVALS_HANDLED ? "handled" : "pending"));
const isPending = computed(() => status.value === "pending");
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn(status);

const { data, isLoading, error, reload } = useResource((signal) => listApprovals({ status: status.value, page: page.value }, signal), {
  watch: [status, page],
});

const columns = computed(() => {
  if (!isWide.value) {
    return narrowColumns;
  }

  return isPending.value ? pendingColumns : handledColumns;
});

const emptyTitle = computed(() => (isPending.value ? "No pending approvals" : "Nothing handled yet"));

const loanApproval = ref<TApproval>();
const reasonTarget = ref<TReasonTarget>();

const isReasonOpen = computed({
  get: () => reasonTarget.value != null,
  set: (value) => {
    if (!value) {
      reasonTarget.value = undefined;
    }
  },
});

const { run, isRunning, error: actionError } = useAction((call: () => Promise<unknown>) => call(), { inline: ["approval.not_pending"] });

async function decide(call: () => Promise<unknown>, successMessage: string) {
  await run(call);

  if (actionError.value?.code === "approval.not_pending") {
    toast.show("Already handled", "info");
    reload();

    return true;
  }

  if (actionError.value != null) {
    return false;
  }

  toast.show(successMessage);
  reload();

  return true;
}

async function confirmThen(options: TConfirmOptions, call: () => Promise<unknown>, successMessage: string) {
  const isConfirmed = await confirmDialog.confirm(options);

  if (isConfirmed) {
    await decide(call, successMessage);
  }
}

async function submitReason(reason: string) {
  const target = reasonTarget.value;

  if (target == null) {
    return;
  }

  const isDone = await decide(() => target.submit(reason), target.successMessage);

  if (isDone) {
    reasonTarget.value = undefined;
  }
}

function requestLabel(approval: TApproval) {
  switch (approval.kind) {
    case "void":
      return `Void ${VOID_SOURCE_LABEL[approval.item.refType]} · ${formatMoney(approval.item.amount)}`;
    case "loan":
      return `${LOAN_TYPE_LABEL[approval.item.type]} · ${approval.item.employeeName}`;
    case "waiver":
      return `Deposit waiver · ${approval.item.customerName}`;
    case "customer":
      return `New customer · ${fullName(approval.item)}`;
    case "sync_conflict":
      return `${SYNC_OP_KIND_LABEL[approval.item.opKind]} · ${approval.item.riderName}`;
  }
}

function detailLines(approval: TApproval) {
  switch (approval.kind) {
    case "void":
      return [approval.item.summary, `Reason: ${approval.item.reason}`];
    case "loan":
      return [
        `Principal: ${formatMoney(approval.item.principal)}`,
        `Interest: ${formatMoney(approval.item.preview.totalInterest)}`,
        `Installment / pay run: ${formatMoney(approval.item.preview.installment)}`,
      ];
    case "waiver":
      return [];
    case "customer":
      return [approval.item.phone, approval.item.address];
    case "sync_conflict":
      return [
        `Recorded ${formatDateTime(approval.item.occurredAt)}`,
        approval.item.summary,
        approval.item.codes.map((code) => SYNC_CONFLICT_CODE_LABEL[code] ?? code).join(", "),
      ];
  }
}

function customerId(approval: TApproval) {
  switch (approval.kind) {
    case "customer":
      return approval.item.id;
    case "waiver":
      return approval.item.customerId;
    default:
      return undefined;
  }
}

function rejectAction(target: TReasonTarget): TRowAction {
  return { label: target.confirmLabel, icon: IconX, variant: "danger", onSelect: () => (reasonTarget.value = target) };
}

function pendingActions(approval: TApproval): TRowAction[] {
  switch (approval.kind) {
    case "void": {
      const { id } = approval.item;

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            confirmThen(
              { title: "Approve void?", message: "This reverses the sale, its containers, deposits, stock and cash.", confirmLabel: "Approve void" },
              () => approveVoid(id),
              "Void approved"
            ),
        },
        rejectAction({ title: "Reject void", confirmLabel: "Reject", successMessage: "Rejected", submit: (reason) => rejectVoid({ id, body: { reason } }) }),
      ];
    }
    case "loan": {
      const { id } = approval.item;

      return [
        { label: "Approve & release", icon: IconCheck, variant: "primary", onSelect: () => (loanApproval.value = approval) },
        rejectAction({ title: "Reject loan", confirmLabel: "Reject", successMessage: "Rejected", submit: (reason) => rejectLoan({ id, body: { reason } }) }),
      ];
    }
    case "waiver": {
      const { id, customerName } = approval.item;

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            confirmThen(
              { title: `Waive deposits for ${customerName}?`, message: "Their deliveries will no longer collect container deposits.", confirmLabel: "Approve" },
              () => approveWaiverRequest(id),
              "Approved"
            ),
        },
        rejectAction({
          title: "Reject waiver",
          confirmLabel: "Reject",
          successMessage: "Rejected",
          submit: (reason) => rejectWaiverRequest({ id, body: { reason } }),
        }),
      ];
    }
    case "customer": {
      const { id } = approval.item;
      const name = fullName(approval.item);

      return [
        {
          label: "Approve",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            confirmThen(
              { title: `Approve ${name}?`, message: "They become an active customer.", confirmLabel: "Approve" },
              () => approveCustomer(id),
              "Approved"
            ),
        },
      ];
    }
    case "sync_conflict": {
      const { conflictId, opKind, refId, canVoid } = approval.item;
      const actions: TRowAction[] = [];

      if (refId != null) {
        actions.push({
          label: "Accept",
          icon: IconCheck,
          variant: "primary",
          onSelect: () =>
            confirmThen(
              { title: "Keep what the rider recorded?", message: approval.item.summary, confirmLabel: "Accept" },
              () => acceptSyncConflict(conflictId),
              "Kept"
            ),
        });
      }

      if (canVoid) {
        actions.push(
          rejectAction({
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

function approvalActions(approval: TApproval) {
  const actions: TRowAction[] = [];
  const id = customerId(approval);

  if (id != null) {
    actions.push({ label: "View customer", icon: IconUserCircle, to: ROUTES.OWNER.CUSTOMERS.DETAIL(id) });
  }

  return approval.status === "pending" ? [...actions, ...pendingActions(approval)] : actions;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="Approvals"
      :icon="IconStamp"
      :tabs="OWNER_TABS.APPROVALS"
      :columns="columns"
      :rows="data?.items ?? []"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-actions="approvalActions"
      :row-label="requestLabel"
      :row-key="(row) => `${row.kind}:${row.id}`"
      @retry="reload"
    >
      <template #cell-request="{ row }">
        <span class="block">{{ requestLabel(row) }}</span>
        <template v-if="!isWide">
          <span class="block text-sm text-zinc-500">{{ row.requestedByName }} · {{ formatDateTime(row.createdAt) }}</span>
          <span v-if="row.decision != null" class="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <UiStatusPill :tone="DECISION_TONE[row.decision]">{{ DECISION_LABEL[row.decision] }}</UiStatusPill>
            <span v-if="row.decidedByName != null">{{ row.decidedByName }}</span>
          </span>
          <span v-if="row.decisionReason" class="block max-w-56 text-sm whitespace-normal text-zinc-500">{{ row.decisionReason }}</span>
          <span v-for="line in detailLines(row)" :key="line" class="block max-w-56 text-sm whitespace-normal text-zinc-500">{{ line }}</span>
        </template>
      </template>
      <template #cell-createdAt="{ row }">{{ formatDateTime(row.createdAt) }}</template>
      <template #cell-details="{ row }">
        <div class="flex flex-col gap-0.5 text-sm whitespace-normal text-zinc-600">
          <span v-for="line in detailLines(row)" :key="line">{{ line }}</span>
        </div>
      </template>
      <template #cell-decision="{ row }">
        <UiStatusPill v-if="row.decision != null" :tone="DECISION_TONE[row.decision]">{{ DECISION_LABEL[row.decision] }}</UiStatusPill>
      </template>
      <template #cell-decisionReason="{ row }">
        <span class="block max-w-64 text-sm whitespace-normal text-zinc-600">{{ row.decisionReason }}</span>
      </template>
      <template #empty>
        <UiEmptyState :title="emptyTitle" />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <LoanApproveSheet v-model:approval="loanApproval" @submit="reload" />
    <UiReasonSheet
      v-model:open="isReasonOpen"
      :title="reasonTarget?.title ?? ''"
      :confirm-label="reasonTarget?.confirmLabel"
      :is-submitting="isRunning"
      @submit="submitReason"
    />
  </div>
</template>
