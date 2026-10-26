<script setup lang="ts">
import type { TPayLine, TPayLineDeduction } from "@wrs/contract/payroll";

import { dismissPayRunShortage, excludePayRunShortage, finalizePayRun, getPayRun, recomputePayRun } from "@/services/payRun";
import type { ApiError } from "@/lib/http";
import { ROUTES, type TRowAction } from "@/types";

definePage({ meta: { title: "Payroll run" } });

type TShortageMode = "exclude" | "dismiss";

const route = useRoute("/owner/people/payroll/[id]");
const toast = useToast();
const confirmDialog = useConfirm();

const runId = computed(() => route.params.id);

const { data, isLoading, error, reload } = useResource((signal) => getPayRun(runId.value, signal), { watch: [runId] });

const isDraft = computed(() => data.value?.status === "draft");
const title = computed(() => (data.value == null ? "Payroll run" : formatPeriod(data.value.periodStart, data.value.periodEnd)));
const subtitle = computed(() => (data.value == null ? undefined : PAY_FREQUENCY_LABEL[data.value.frequency]));

const wideColumns = [
  { key: "employee", label: "Employee" },
  { key: "days", label: "Days" },
  { key: "gross", label: "Gross", align: "right" as const },
  { key: "deductions", label: "Deductions", align: "right" as const },
  { key: "net", label: "Net", align: "right" as const },
];

const narrowColumns = [{ key: "employee", label: "Pay line" }];

const isWide = useMediaQuery("(min-width: 640px)");
const columns = computed(() => (isWide.value ? wideColumns : narrowColumns));

const SHORTAGE_SHEET = {
  exclude: { title: "Exclude shortage from this run", confirmLabel: "Exclude", toast: "Shortage excluded" },
  dismiss: { title: "Dismiss shortage", confirmLabel: "Dismiss", toast: "Shortage dismissed" },
} as const;

const daysLine = ref<TPayLine>();
const adjustLine = ref<TPayLine>();
const shortageTarget = ref<{ mode: TShortageMode; shortageId: string }>();

const isShortageOpen = computed({
  get: () => shortageTarget.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      shortageTarget.value = undefined;
    }
  },
});

const shortageSheet = computed(() => SHORTAGE_SHEET[shortageTarget.value?.mode ?? "exclude"]);

const { run: runRecompute, isRunning: isRecomputing, error: recomputeError } = useAction(recomputePayRun);
const { run: runFinalize, isRunning: isFinalizing, error: finalizeError } = useAction(finalizePayRun);
const { run: runExclude, isRunning: isExcluding, error: excludeError } = useAction(excludePayRunShortage);
const { run: runDismiss, isRunning: isDismissing, error: dismissError } = useAction(dismissPayRunShortage);

function reloadIfFinalized(actionError?: ApiError) {
  if (actionError?.code === "payroll.finalized") {
    reload();
  }
}

async function recompute() {
  await runRecompute(runId.value);

  if (recomputeError.value != null) {
    reloadIfFinalized(recomputeError.value);

    return;
  }

  toast.show("Run recomputed");
  reload();
}

async function finalize() {
  const isConfirmed = await confirmDialog.confirm({
    title: "Finalize payroll run?",
    message:
      "This locks the run, settles every listed deduction and carries any shortfall to the next run.\nCorrections after this go in the next run as adjustments.",
    confirmLabel: "Finalize",
    variant: "danger",
  });

  if (!isConfirmed) {
    return;
  }

  await runFinalize(runId.value);

  if (finalizeError.value != null) {
    reloadIfFinalized(finalizeError.value);

    return;
  }

  toast.show("Payroll run finalized");
  reload();
}

async function submitShortage(reason: string) {
  const target = shortageTarget.value;

  if (target == null) {
    return;
  }

  const payload = { id: runId.value, shortageId: target.shortageId, body: { reason } };

  if (target.mode === "exclude") {
    await runExclude(payload);
  } else {
    await runDismiss(payload);
  }

  const actionError = target.mode === "exclude" ? excludeError.value : dismissError.value;

  if (actionError?.code === "payroll.finalized") {
    shortageTarget.value = undefined;
    reload();
  }

  if (actionError != null) {
    return;
  }

  toast.show(SHORTAGE_SHEET[target.mode].toast);
  shortageTarget.value = undefined;
  reload();
}

function shortageDeductions({ deductions }: TPayLine) {
  return deductions.filter((deduction): deduction is TPayLineDeduction & { refId: string } => deduction.kind === "shortage" && deduction.refId != null);
}

function lineActions(line: TPayLine): TRowAction[] {
  if (!isDraft.value) {
    return [];
  }

  const shortageActions = shortageDeductions(line).flatMap<TRowAction>(({ refId, amount, note }) => {
    const detail = [note, formatMoney(amount)].filter((part) => part != null).join(" · ");

    return [
      { label: `Exclude shortage ${detail}`, variant: "ghost", onSelect: () => (shortageTarget.value = { mode: "exclude", shortageId: refId }) },
      { label: `Dismiss shortage ${detail}`, variant: "ghost", onSelect: () => (shortageTarget.value = { mode: "dismiss", shortageId: refId }) },
    ];
  });

  return [
    { label: "Edit days", onSelect: () => (daysLine.value = line) },
    { label: "Adjust", variant: "ghost", onSelect: () => (adjustLine.value = line) },
    ...shortageActions,
  ];
}

function deductionLabel({ kind, note }: TPayLineDeduction) {
  return note == null ? DEDUCTION_LABEL[kind] : `${DEDUCTION_LABEL[kind]} · ${note}`;
}

function daysText({ daysWorked, daysWorkedOverride }: TPayLine) {
  return `${daysWorked}${daysWorkedOverride != null ? " (edited)" : ""}`;
}

function leaveText({ paidLeaveDays, unpaidLeaveDays, delivered }: TPayLine) {
  return [
    paidLeaveDays > 0 ? `Paid leave: ${paidLeaveDays}` : undefined,
    unpaidLeaveDays > 0 ? `Unpaid leave: ${unpaidLeaveDays}` : undefined,
    delivered > 0 ? `Delivered: ${delivered}` : undefined,
  ]
    .filter((part) => part != null)
    .join(" · ");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader :title :subtitle :back="ROUTES.OWNER.PEOPLE.PAYROLL.INDEX">
      <template v-if="data != null" #actions>
        <template v-if="isDraft">
          <UiButton variant="secondary" :loading="isRecomputing" @click="recompute">Recompute</UiButton>
          <UiButton variant="danger" :loading="isFinalizing" @click="finalize">Finalize run</UiButton>
        </template>
        <UiStatusPill v-else :tone="PAY_RUN_STATUS_TONE[data.status]">{{ PAY_RUN_STATUS_LABEL[data.status] }}</UiStatusPill>
      </template>
    </UiPageHeader>

    <p class="text-sm text-zinc-500">Payroll runs require an online connection to create, adjust or finalize.</p>

    <p v-if="data != null && !isDraft" class="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
      This run is finalized and read-only<template v-if="data.finalizedByName != null"> (by {{ data.finalizedByName }})</template>. Corrections go in the next
      run as adjustments.
    </p>

    <UiDataTable
      :row-actions="lineActions"
      :columns
      :rows="data?.lines ?? []"
      :row-key="(row) => row.employeeId"
      :row-label="(row) => row.employeeName"
      :is-loading="isLoading"
      :error="error?.message"
      @retry="reload"
    >
      <template #cell-employee="{ row }">
        <span class="block">{{ row.employeeName }}</span>
        <span v-if="!isWide" class="flex items-center gap-2 text-sm text-zinc-500"> Days {{ daysText(row) }} · Net <UiMoneyText :centavos="row.net" /> </span>
        <details class="mt-1 text-sm text-zinc-500">
          <summary class="cursor-pointer text-brand-700">Breakdown</summary>
          <dl class="mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
            <dt v-if="leaveText(row)" class="col-span-2">{{ leaveText(row) }}</dt>
            <dt>Base</dt>
            <dd class="text-right"><UiMoneyText :centavos="row.base" size="sm" /></dd>
            <dt>Incentive</dt>
            <dd class="text-right"><UiMoneyText :centavos="row.incentive" size="sm" /></dd>
            <template v-for="adjustment in row.adjustments" :key="adjustment.id">
              <dt class="max-w-48 whitespace-normal">Adjustment · {{ adjustment.reason }}</dt>
              <dd class="text-right"><UiMoneyText :centavos="adjustment.amount" size="sm" /></dd>
            </template>
            <dt>Gross</dt>
            <dd class="text-right"><UiMoneyText :centavos="row.gross" size="sm" /></dd>
            <template v-for="(deduction, index) in row.deductions" :key="index">
              <dt class="max-w-48 whitespace-normal">{{ deductionLabel(deduction) }}</dt>
              <dd class="text-right"><UiMoneyText :centavos="deduction.amount" size="sm" tone="danger" /></dd>
            </template>
            <template v-if="row.creditRecovered > 0">
              <dt>Credit recovered</dt>
              <dd class="text-right"><UiMoneyText :centavos="row.creditRecovered" size="sm" tone="ok" /></dd>
            </template>
            <template v-if="row.carriedOver > 0">
              <dt class="text-amber-700">Carried over to next run</dt>
              <dd class="text-right"><UiMoneyText :centavos="row.carriedOver" size="sm" tone="warn" /></dd>
            </template>
            <template v-if="row.creditPayback > 0">
              <dt>Credit paid back</dt>
              <dd class="text-right"><UiMoneyText :centavos="row.creditPayback" size="sm" tone="ok" /></dd>
            </template>
            <dt class="font-medium text-zinc-900">Net</dt>
            <dd class="text-right"><UiMoneyText :centavos="row.net" size="sm" /></dd>
          </dl>
        </details>
      </template>
      <template #cell-days="{ row }">{{ daysText(row) }}</template>
      <template #cell-gross="{ row }">
        <UiMoneyText :centavos="row.gross" size="sm" />
      </template>
      <template #cell-deductions="{ row }">
        <UiMoneyText :centavos="row.deductionsTotal" size="sm" tone="danger" />
      </template>
      <template #cell-net="{ row }">
        <UiMoneyText :centavos="row.net" size="lg" />
      </template>
      <template #empty>
        <UiEmptyState title="No pay lines yet" description="Pay lines are computed once the run has activity to include." />
      </template>
      <template v-if="data != null" #footer>
        <div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-medium text-zinc-700">
          <span>Gross <UiMoneyText :centavos="data.grossTotal" size="sm" /></span>
          <span>Deductions <UiMoneyText :centavos="data.deductionsTotal" size="sm" tone="danger" /></span>
          <span>Net <UiMoneyText :centavos="data.netTotal" /></span>
        </div>
      </template>
    </UiDataTable>

    <PayrollDaysSheet v-model:line="daysLine" :run-id="runId" @submit="reload" />

    <PayrollAdjustSheet v-model:line="adjustLine" :run-id="runId" @submit="reload" />

    <UiReasonSheet
      v-model:open="isShortageOpen"
      :title="shortageSheet.title"
      :confirm-label="shortageSheet.confirmLabel"
      :is-submitting="isExcluding || isDismissing"
      @submit="submitShortage"
    />
  </div>
</template>
