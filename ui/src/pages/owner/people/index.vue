<script setup lang="ts">
import type { TEmployee } from "@wrs/contract/employee";

import { IconIdentificationBadge } from "@/components";
import { listEmployees } from "@/services/employee";
import { ROLE_LABEL, ROLE_OPTIONS, ROUTES, OWNER_TABS, type TOption, type TRole, type TRowAction } from "@/types";

definePage({ meta: { title: "Employees" } });

type TRoleFilter = "all" | TRole;
type TActiveFilter = "active" | "inactive" | "all";

const PAGE_SIZE = 20;

const router = useRouter();
const employeeStore = useEmployeeStore();

const q = useRouteQuery("q", "");
const role = useRouteQuery<TRoleFilter>("role", "all", { mode: "push" });
const active = useRouteQuery<TActiveFilter>("active", "active", { mode: "push" });
const { page, resetPageOn, clampTo } = usePageQuery();

resetPageOn([q, role, active]);

const { data, isLoading, error, reload } = useResource(
  (signal) =>
    listEmployees(
      {
        q: q.value || undefined,
        role: role.value === "all" ? undefined : role.value,
        active: active.value,
        page: page.value,
        pageSize: PAGE_SIZE,
      },
      signal
    ),
  { watch: [q, role, active, page], debounce: 300 }
);

const columns = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "roles", label: "Roles" },
  { key: "status", label: "Status" },
];

const roleOptions: TOption<TRoleFilter>[] = [{ value: "all", label: "All roles" }, ...ROLE_OPTIONS];

const activeOptions: TOption<TActiveFilter>[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

const addOpen = ref(false);
const editing = ref<TEmployee>();
const resettingPassword = ref<TEmployee>();

function rowActions(employee: TEmployee): TRowAction[] {
  return [
    { label: "Edit", onSelect: () => (editing.value = employee) },
    { label: "Reset password", onSelect: () => (resettingPassword.value = employee) },
  ];
}

async function onSaved() {
  await Promise.all([reload(), employeeStore.refresh()]);
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
      :rows="data?.items ?? []"
      :total="data?.total"
      :is-loading="isLoading"
      :error="error?.message"
      :row-key="(row) => row.id"
      :row-actions="rowActions"
      :row-label="fullName"
      @row-click="openEmployee"
      @retry="reload"
    >
      <template #actions>
        <UiSearchInput v-model="q" class="w-full sm:w-auto" label="Search employees" />
        <UiSelect v-model="role" label="Role" :options="roleOptions" />
        <UiSegmentedControl v-model="active" :options="activeOptions" />
        <UiButton @click="addOpen = true">Add employee</UiButton>
      </template>
      <template #cell-name="{ row }">{{ fullName(row) }}</template>
      <template #cell-phone="{ row }">{{ row.phone ?? "—" }}</template>
      <template #cell-roles="{ row }">
        <div class="flex flex-wrap gap-1">
          <UiStatusPill v-for="employeeRole in row.roles" :key="employeeRole" tone="info">{{ ROLE_LABEL[employeeRole] }}</UiStatusPill>
        </div>
      </template>
      <template #cell-status="{ row }">
        <UiStatusPill :tone="row.active ? 'ok' : 'neutral'">{{ row.active ? "Active" : "Inactive" }}</UiStatusPill>
      </template>
      <template #empty>
        <UiEmptyState title="No employees match" />
      </template>
      <template #footer>
        <UiPagination v-if="data != null" v-model:page="page" :total="data.total" :page-size="PAGE_SIZE" @clamp="clampTo" />
      </template>
    </UiDataTable>

    <EmployeeAddSheet v-model:open="addOpen" @submit="onSaved" />
    <EmployeeEditSheet v-model:employee="editing" @submit="onSaved" />
    <EmployeePasswordSheet v-model:employee="resettingPassword" />
  </div>
</template>
