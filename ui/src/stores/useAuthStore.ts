import type { TEmployee, TRole } from "@/types";
import { employees } from "@/mocks/employees";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const user = ref<TEmployee>();
    const activeRole = ref<TRole>();

    const isAuthenticated = computed(() => user.value != null);

    function login(employeeId: string, role: TRole) {
      const employee = employees.find((candidate) => candidate.id === employeeId);

      if (!employee || !employee.roles.includes(role)) {
        throw new Error("Employee does not hold that role.");
      }

      user.value = employee;
      activeRole.value = role;
    }

    function switchRole(role: TRole) {
      if (!user.value?.roles.includes(role)) {
        throw new Error("Employee does not hold that role.");
      }

      activeRole.value = role;
    }

    function logout() {
      user.value = undefined;
      activeRole.value = undefined;
    }

    return { user, activeRole, isAuthenticated, login, switchRole, logout };
  },
  { persist: { pick: ["user", "activeRole"] } }
);
