<script setup lang="ts">
import { employees, payPlans as payPlansMock } from "@/mocks/employees";
import { ROLE_LABEL, ROUTES, type TPayPlan } from "@/types";

definePage({ meta: { title: "Employee" } });

const route = useRoute("/owner/people/employees/[id]");

const employee = computed(() => employees.find((candidate) => candidate.id === route.params.id));

const payPlans = ref<TPayPlan[]>([...payPlansMock]);

const history = computed(() =>
  payPlans.value.filter((plan) => plan.employeeId === route.params.id).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
);
const currentPlan = computed(() => latestEffective(history.value));

const historyColumns = [
  { key: "effectiveFrom", label: "Effective from" },
  { key: "baseRate", label: "Base rate", align: "right" as const },
];

const editOpen = ref(false);
</script>

<template>
  <div v-if="employee" class="flex flex-col gap-4">
    <UiPageHeader :title="employee.name" :subtitle="employee.phone" />

    <UiCard title="Roles">
      <div class="flex flex-wrap gap-2">
        <UiStatusPill v-for="role in employee.roles" :key="role" tone="info">{{ ROLE_LABEL[role] }}</UiStatusPill>
        <UiStatusPill :tone="employee.active ? 'ok' : 'neutral'">{{ employee.active ? "Active" : "Inactive" }}</UiStatusPill>
      </div>
    </UiCard>

    <UiCard title="Current pay plan">
      <template #actions>
        <UiButton size="md" variant="secondary" @click="editOpen = true">Edit pay plan</UiButton>
      </template>

      <div v-if="currentPlan" class="flex flex-col gap-1 text-base text-zinc-700">
        <p>{{ PAY_FREQUENCY_LABEL[currentPlan.frequency] }} · {{ currentPlan.rateBasis }}</p>
        <p>Base rate: <UiMoneyText :centavos="currentPlan.baseRate" /></p>
        <p v-if="currentPlan.quota">Quota: {{ currentPlan.quota }} containers/day</p>
        <p v-if="currentPlan.incentivePerContainer">Incentive: <UiMoneyText :centavos="currentPlan.incentivePerContainer" /> per container above quota</p>
        <p v-if="currentPlan.deductionCapPct">Deduction cap: {{ currentPlan.deductionCapPct }}% of gross</p>
        <p class="text-sm text-zinc-500">Effective from {{ formatDate(currentPlan.effectiveFrom) }}</p>
      </div>
      <UiEmptyState v-else title="No pay plan set" />
    </UiCard>

    <UiDataTable title="History" :columns="historyColumns" :rows="history" :row-key="(row) => row.effectiveFrom">
      <template #cell-effectiveFrom="{ row }">From {{ formatDate(row.effectiveFrom) }}</template>
      <template #cell-baseRate="{ row }">
        <UiMoneyText :centavos="row.baseRate" tone="muted" />
      </template>
      <template #empty>
        <UiEmptyState title="No pay plan history yet" />
      </template>
    </UiDataTable>

    <EmployeePayPlanSheet v-model:open="editOpen" :employee-id="employee.id" :plan="currentPlan" @submit="payPlans.push($event)" />
  </div>

  <UiEmptyState v-else title="Employee not found" description="It may have been removed.">
    <template #action>
      <UiButton :to="ROUTES.OWNER.PEOPLE.INDEX">Back to employees</UiButton>
    </template>
  </UiEmptyState>
</template>
