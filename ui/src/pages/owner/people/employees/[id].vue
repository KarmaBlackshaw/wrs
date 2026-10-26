<script setup lang="ts">
import maxBy from "lodash/maxBy";

import { getEmployee } from "@/services/employee";
import { ROLE_LABEL, ROUTES } from "@/types";

definePage({ meta: { title: "Employee" } });

const route = useRoute("/owner/people/employees/[id]");

const { data: employee, isLoading, error, reload } = useResource((signal) => getEmployee(route.params.id, signal), { watch: () => route.params.id });

const backTo = ref<string>(ROUTES.OWNER.PEOPLE.INDEX);

watch(
  () => route.params.id,
  () => {
    const { back } = window.history.state;
    const isFromList = typeof back === "string" && (back === ROUTES.OWNER.PEOPLE.INDEX || back.startsWith(`${ROUTES.OWNER.PEOPLE.INDEX}?`));

    backTo.value = isFromList ? back : ROUTES.OWNER.PEOPLE.INDEX;
  },
  { immediate: true }
);

const isNotFound = computed(() => error.value?.code === "not_found");

const latestPlan = computed(() => maxBy(employee.value?.planHistory, (plan) => plan.effectiveFrom) ?? employee.value?.currentPlan ?? undefined);

const historyColumns = [
  { key: "effectiveFrom", label: "Effective" },
  { key: "baseRate", label: "Base rate", align: "right" as const },
];

const absenceColumns = [
  { key: "from", label: "Dates" },
  { key: "days", label: "Days", align: "right" as const },
];

const editOpen = ref(false);
</script>

<template>
  <UiEmptyState v-if="isNotFound" title="Employee not found" description="It may have been removed.">
    <template #action>
      <UiButton :to="backTo">Back to employees</UiButton>
    </template>
  </UiEmptyState>

  <UiEmptyState v-else-if="error != null" title="Couldn't load" :description="error.message">
    <template #action>
      <UiButton variant="secondary" @click="reload">Retry</UiButton>
    </template>
  </UiEmptyState>

  <div v-else-if="employee != null" class="flex flex-col gap-4">
    <UiPageHeader :title="fullName(employee)" :subtitle="employee.phone ?? undefined" :back="backTo">
      <template #actions>
        <UiStatusPill :tone="employee.active ? 'ok' : 'neutral'">{{ employee.active ? "Active" : "Inactive" }}</UiStatusPill>
      </template>
    </UiPageHeader>

    <UiCard title="Roles">
      <div class="flex flex-wrap gap-2">
        <UiStatusPill v-for="role in employee.roles" :key="role" tone="info">{{ ROLE_LABEL[role] }}</UiStatusPill>
      </div>
    </UiCard>

    <UiCard title="Current pay plan">
      <template #actions>
        <UiButton size="md" variant="secondary" @click="editOpen = true">Edit pay plan</UiButton>
      </template>

      <div v-if="employee.currentPlan != null" class="flex flex-col gap-1 text-base text-zinc-700">
        <p>{{ PAY_FREQUENCY_LABEL[employee.currentPlan.frequency] }} · {{ RATE_BASIS_LABEL[employee.currentPlan.rateBasis] }}</p>
        <p>Base rate: <UiMoneyText :centavos="employee.currentPlan.baseRate" /></p>
        <p v-if="employee.currentPlan.quota != null">Quota: {{ employee.currentPlan.quota }} containers/day</p>
        <p v-if="employee.currentPlan.incentivePerContainer != null">
          Incentive: <UiMoneyText :centavos="employee.currentPlan.incentivePerContainer" /> per container above quota
        </p>
        <p v-if="employee.currentPlan.deductionCapPct != null">Deduction cap: {{ employee.currentPlan.deductionCapPct }}% of gross</p>
        <p class="text-sm text-zinc-500">Effective from {{ formatDate(employee.currentPlan.effectiveFrom) }}</p>
      </div>
      <UiEmptyState v-else title="No pay plan set" />
    </UiCard>

    <UiCard :title="`PTO ${employee.pto.year}`">
      <div class="flex flex-col gap-1 text-base text-zinc-700">
        <p>{{ employee.pto.remaining }} of {{ employee.pto.allowance }} days remaining</p>
        <p class="text-sm text-zinc-500">{{ employee.pto.used }} used</p>
      </div>
    </UiCard>

    <UiDataTable title="History" :columns="historyColumns" :rows="employee.planHistory" :row-key="(row) => row.id" :is-loading="isLoading">
      <template #cell-effectiveFrom="{ row }">
        From {{ formatDate(row.effectiveFrom) }}<template v-if="row.effectiveTo != null"> to {{ formatDate(row.effectiveTo) }}</template>
      </template>
      <template #cell-baseRate="{ row }">
        <UiMoneyText :centavos="row.baseRate" tone="muted" />
      </template>
      <template #empty>
        <UiEmptyState title="No pay plan history yet" />
      </template>
    </UiDataTable>

    <UiDataTable title="Absences" :columns="absenceColumns" :rows="employee.absences" :row-key="(row) => row.id" :is-loading="isLoading">
      <template #cell-from="{ row }">{{ formatDate(row.from) }} – {{ formatDate(row.to) }}</template>
      <template #empty>
        <UiEmptyState title="No absences recorded" />
      </template>
    </UiDataTable>

    <EmployeePayPlanSheet v-model:open="editOpen" :employee-id="employee.id" :current-plan="latestPlan" @submit="reload()" />
  </div>

  <p v-else-if="isLoading" class="text-sm text-zinc-500">Loading…</p>
</template>
