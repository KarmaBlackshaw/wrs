<script setup lang="ts">
import type { TPayRun } from "@wrs/contract/payroll";

import { IconIdentificationBadge } from "@/components";
import { listPayRuns } from "@/services/payRun";
import { ROUTES, OWNER_TABS } from "@/types";

definePage({ meta: { title: "Payroll" } });

const router = useRouter();

const { data, isLoading, error, reload } = useResource((signal) => listPayRuns(signal));

const wideColumns = [
  { key: "period", label: "Period" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
  { key: "grossTotal", label: "Gross", align: "right" as const },
  { key: "deductionsTotal", label: "Deductions", align: "right" as const },
  { key: "netTotal", label: "Net", align: "right" as const },
];

const narrowColumns = [{ key: "period", label: "Run" }];

const isWide = useMediaQuery("(min-width: 640px)");
const columns = computed(() => (isWide.value ? wideColumns : narrowColumns));

const isAddOpen = ref(false);

function openRun(run: TPayRun) {
  router.push(ROUTES.OWNER.PEOPLE.PAYROLL.RUN(run.id));
}

function runLabel({ periodStart, periodEnd }: TPayRun) {
  return `Pay run ${formatPeriod(periodStart, periodEnd)}`;
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="People"
      :icon="IconIdentificationBadge"
      :tabs="OWNER_TABS.PEOPLE"
      clickable
      :columns
      :rows="data ?? []"
      :row-key="(row) => row.id"
      :row-label="runLabel"
      :is-loading="isLoading"
      :error="error?.message"
      @row-click="openRun"
      @retry="reload"
    >
      <template #actions>
        <UiButton @click="isAddOpen = true">New run</UiButton>
      </template>
      <template #cell-period="{ row }">
        <span class="block">{{ formatPeriod(row.periodStart, row.periodEnd) }}</span>
        <span v-if="!isWide" class="flex items-center gap-2">
          <UiMoneyText :centavos="row.netTotal" />
          <UiStatusPill :tone="PAY_RUN_STATUS_TONE[row.status]">{{ PAY_RUN_STATUS_LABEL[row.status] }}</UiStatusPill>
        </span>
        <span v-if="!isWide" class="block text-sm text-zinc-500">{{ PAY_FREQUENCY_LABEL[row.frequency] }}</span>
      </template>
      <template #cell-frequency="{ row }">{{ PAY_FREQUENCY_LABEL[row.frequency] }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="PAY_RUN_STATUS_TONE[row.status]">{{ PAY_RUN_STATUS_LABEL[row.status] }}</UiStatusPill>
      </template>
      <template #cell-grossTotal="{ row }">
        <UiMoneyText :centavos="row.grossTotal" />
      </template>
      <template #cell-deductionsTotal="{ row }">
        <UiMoneyText :centavos="row.deductionsTotal" tone="danger" />
      </template>
      <template #cell-netTotal="{ row }">
        <UiMoneyText :centavos="row.netTotal" />
      </template>
      <template #empty>
        <UiEmptyState title="No payroll runs yet" />
      </template>
    </UiDataTable>

    <PayrollNewRunSheet v-model:open="isAddOpen" @submit="openRun" />
  </div>
</template>
