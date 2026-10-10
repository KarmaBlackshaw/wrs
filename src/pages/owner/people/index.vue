<script setup lang="ts">
import { IconIdentificationBadge } from "@/components";
import { employees as employeesMock } from "@/mocks/employees";
import { ROLE_LABEL, ROUTES, OWNER_TABS } from "@/types";
import type { TEmployee } from "@/types";

definePage({ meta: { title: "Employees" } });

const router = useRouter();

const employees = ref<TEmployee[]>([...employeesMock]);

const columns = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "roles", label: "Roles" },
  { key: "status", label: "Status" },
];

const addOpen = ref(false);

function addEmployee(employee: Pick<TEmployee, "name" | "phone" | "roles">) {
  employees.value.push({
    id: `emp-${employees.value.length + 1}`,
    ...employee,
    active: true,
  });
}

function openEmployee(employee: TEmployee) {
  router.push(ROUTES.OWNER.PEOPLE.EMPLOYEE(employee.id));
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
      :rows="employees"
      :row-key="(row) => row.id"
      @row-click="openEmployee"
    >
      <template #actions>
        <UiButton @click="addOpen = true">Add employee</UiButton>
      </template>
      <template #cell-roles="{ row }">
        <div class="flex flex-wrap gap-1">
          <UiStatusPill v-for="role in row.roles" :key="role" tone="info">{{ ROLE_LABEL[role] }}</UiStatusPill>
        </div>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="row.active ? 'ok' : 'neutral'">{{ row.active ? "Active" : "Inactive" }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No employees yet" />
      </template>
    </UiDataTable>

    <EmployeeAddSheet v-model:open="addOpen" @submit="addEmployee" />
  </div>
</template>
