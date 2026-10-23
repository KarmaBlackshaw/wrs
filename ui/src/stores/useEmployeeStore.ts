import type { TOption } from "@/types";

import { employees as mockEmployees } from "@/mocks/employees";
import { listEmployeeOptions } from "@/services/employee";

export const useEmployeeStore = defineStore("employee", () => {
  const employees = ref(mockEmployees);
  const riderOptions = ref<TOption[]>([]);
  const isLoaded = ref(false);

  const riders = computed(() => employees.value.filter((employee) => employee.active && employee.roles.includes("rider")));

  async function refresh() {
    const options = await listEmployeeOptions({ role: "rider" });

    riderOptions.value = options.map(({ id, name }) => ({ value: id, label: name }));
    isLoaded.value = true;
  }

  async function load() {
    if (isLoaded.value) {
      return;
    }

    await refresh();
  }

  function findEmployee(id: string) {
    return employees.value.find((employee) => employee.id === id);
  }

  function employeeName(id: string) {
    return findEmployee(id)?.name ?? "Unknown";
  }

  return { employees, riders, riderOptions, load, refresh, findEmployee, employeeName };
});
