<script setup lang="ts">
import { employees } from "@/mocks/employees";
import { ROLE_HOME, ROLE_LABEL, type TRole } from "@/types";

definePage({ meta: { layout: "Auth", title: "Log in" } });

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const selectedEmployeeId = ref<string>();

const selectedEmployee = computed(() => employees.find((employee) => employee.id === selectedEmployeeId.value) ?? null);

function pickEmployee(employeeId: string) {
  const employee = employees.find((candidate) => candidate.id === employeeId);

  if (!employee) {
    return;
  }

  if (employee.roles.length === 1 && employee.roles[0]) {
    completeLogin(employee.id, employee.roles[0]);

    return;
  }

  selectedEmployeeId.value = employee.id;
}

function completeLogin(employeeId: string, role: TRole) {
  authStore.login(employeeId, role);

  const redirect = route.query.redirect;

  router.push(typeof redirect === "string" && redirect.startsWith("/") ? redirect : ROLE_HOME[role]);
}
</script>

<template>
  <div class="flex w-full max-w-sm flex-col gap-8">
    <div class="flex items-center">
      <span class="flex items-center gap-2 lg:invisible">
        <span class="grid size-9 place-items-center rounded-lg bg-brand-700 text-white">
          <IconDropFill class="size-5" />
        </span>
        <span class="text-lg font-semibold tracking-tight">WRS</span>
      </span>
    </div>

    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">{{ selectedEmployee ? "Choose a role" : "Log in" }}</h1>
      <p class="text-sm text-zinc-500">{{ selectedEmployee ? `Log in as ${selectedEmployee.name}` : "Select your name" }}</p>
    </div>

    <ul v-if="!selectedEmployee" class="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
      <li v-for="employee in employees" :key="employee.id">
        <button
          type="button"
          class="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
          @click="pickEmployee(employee.id)"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-800">{{
            initials(employee.name)
          }}</span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm font-medium text-zinc-900">{{ employee.name }}</span>
            <span class="truncate text-sm text-zinc-500">{{ employee.roles.map((role) => ROLE_LABEL[role]).join(", ") }}</span>
          </span>
          <IconCaretRight class="size-4 shrink-0 text-zinc-400" />
        </button>
      </li>
    </ul>

    <div v-else class="flex flex-col gap-3">
      <UiButton v-for="role in selectedEmployee.roles" :key="role" block @click="completeLogin(selectedEmployee.id, role)">
        {{ ROLE_LABEL[role] }}
      </UiButton>
      <UiButton variant="ghost" block @click="selectedEmployeeId = undefined">
        <IconArrowLeft class="size-5" />
        Back
      </UiButton>
    </div>
  </div>
</template>
