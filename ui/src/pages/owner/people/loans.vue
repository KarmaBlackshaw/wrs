<script setup lang="ts">
import type { TLoan, TLoanStatus } from "@wrs/contract/loan";

import { IconIdentificationBadge } from "@/components";
import { listLoans, rejectLoan } from "@/services/loan";
import { type TOption, type TRowAction, OWNER_TABS } from "@/types";

type TStatusFilter = "all" | TLoanStatus;

definePage({ meta: { title: "Loans" } });

const toast = useToast();
const fileDownload = useFileDownload();

const status = useRouteQuery<TStatusFilter>("status", "all", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([status]);

const query = computed(() => ({ status: status.value === "all" ? undefined : status.value, page: page.value }));

const { data, isLoading, error, reload } = useResource((signal) => listLoans(query.value, signal), {
  watch: [query],
});

const rows = computed(() => data.value?.items ?? []);

const columns = [
  { key: "employeeName", label: "Employee" },
  { key: "status", label: "Status" },
  { key: "balance", label: "Balance", align: "right" as const },
];

const statusOptions: TOption<TStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "requested", label: LOAN_STATUS_LABEL.requested },
  { value: "released", label: LOAN_STATUS_LABEL.released },
  { value: "paid", label: LOAN_STATUS_LABEL.paid },
  { value: "rejected", label: LOAN_STATUS_LABEL.rejected },
];

const statusLabel = computed(() => (status.value === "all" ? undefined : LOAN_STATUS_LABEL[status.value]));

const scheduleLoan = ref<TLoan>();
const releaseLoan = ref<TLoan>();
const rejectTarget = ref<TLoan>();

const isRejectOpen = computed({
  get: () => rejectTarget.value != null,
  set: (value) => {
    if (!value) {
      rejectTarget.value = undefined;
    }
  },
});

const { run: runReject, isRunning: isRejecting, error: rejectError } = useAction(rejectLoan, { inline: ["approval.not_pending"] });

async function reject(reason: string) {
  const target = rejectTarget.value;

  if (target == null) {
    return;
  }

  const rejected = await runReject({ id: target.id, body: { reason } });

  if (rejected == null && rejectError.value?.code !== "approval.not_pending") {
    return;
  }

  toast.show(rejected == null ? "Already handled" : "Loan rejected", rejected == null ? "error" : "success");

  rejectTarget.value = undefined;
  reload();
}

function hasBalance({ status }: TLoan) {
  return status === "released" || status === "paid";
}

function loanActions(loan: TLoan) {
  const actions: TRowAction[] = [];

  if (loan.status === "requested") {
    actions.push({ label: "Release", variant: "primary", onSelect: () => (releaseLoan.value = loan) });
  }

  if (loan.status === "requested") {
    actions.push({ label: "Reject", variant: "ghost", onSelect: () => (rejectTarget.value = loan) });
  }

  if (loan.status === "released" || loan.status === "paid") {
    actions.push({ label: "Schedule", variant: "ghost", onSelect: () => (scheduleLoan.value = loan) });
  }

  const { authorizationFileId } = loan;

  if (authorizationFileId != null) {
    actions.push({ label: "View IOU photo", variant: "ghost", onSelect: () => fileDownload.open(authorizationFileId) });
  }

  return actions;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      :row-actions="loanActions"
      title="People"
      :icon="IconIdentificationBadge"
      :tabs="OWNER_TABS.PEOPLE"
      :columns
      :rows
      :row-key="(row) => row.id"
      :row-label="(row) => row.employeeName"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #filters>
        <UiFilterChip label="Status" :value="statusLabel" @clear="status = 'all'">
          <UiSegmentedControl v-model="status" :options="statusOptions" />
        </UiFilterChip>
      </template>
      <template #cell-employeeName="{ row }">
        <span class="block">{{ row.employeeName }}</span>
        <span class="block text-sm text-zinc-500"> {{ LOAN_TYPE_LABEL[row.type] }} · <UiMoneyText :centavos="row.principal" size="sm" tone="muted" /> </span>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="LOAN_STATUS_TONE[row.status]">{{ LOAN_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-balance="{ row }">
        <UiMoneyText v-if="hasBalance(row)" :centavos="row.balance" />
        <template v-else>—</template>
      </template>
      <template #empty>
        <UiEmptyState title="No loans match your filter" />
      </template>
      <template v-if="data != null" #footer>
        <UiPagination v-model:page="page" :total="data.total" :page-size="data.pageSize" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <LoanScheduleSheet v-model:loan="scheduleLoan" />

    <LoanReleaseSheet v-model:loan="releaseLoan" @submit="reload" />

    <UiReasonSheet v-model:open="isRejectOpen" title="Reject loan" confirm-label="Reject" :is-submitting="isRejecting" @submit="reject" />
  </div>
</template>
