<script setup lang="ts">
import { IconIdentificationBadge } from "@/components";
import { payRuns as payRunsMock } from "@/mocks/payroll";
import { ROUTES, OWNER_TABS, type TPayRun } from "@/types";

definePage({ meta: { title: "Payroll" } });

const router = useRouter();

const payRuns = ref<TPayRun[]>([...payRunsMock]);
const rows = computed(() => [...payRuns.value].sort((a, b) => b.periodStart.localeCompare(a.periodStart)));

const columns = [
  { key: "period", label: "Period" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
];

const statusTone = {
  draft: "warn",
  finalized: "ok",
} as const;

const addOpen = ref(false);

function addRun(run: Omit<TPayRun, "id">) {
  payRuns.value.push({ id: `run-${payRuns.value.length + 1}`, ...run });
}

function openRun(run: TPayRun) {
  router.push(ROUTES.OWNER.PEOPLE.PAYROLL.RUN(run.id));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiDataTable
      title="People"
      :icon="IconIdentificationBadge"
      :tabs="OWNER_TABS.PEOPLE"
      clickable
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.id"
      @row-click="openRun"
    >
      <template #actions>
        <UiButton @click="addOpen = true">New run</UiButton>
      </template>
      <template #cell-period="{ row }">{{ formatPeriod(row.periodStart, row.periodEnd) }}</template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="statusTone[row.status]">{{ row.status === "finalized" ? "Finalized" : "Draft" }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No payroll runs yet" />
      </template>
    </UiDataTable>

    <PayrollNewRunSheet v-model:open="addOpen" @submit="addRun" />
  </div>
</template>
