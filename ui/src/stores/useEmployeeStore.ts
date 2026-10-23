import { employees as mockEmployees } from "@/mocks/employees";

export const useEmployeeStore = defineStore("employee", () => {
  const employees = ref(mockEmployees);

  const riders = computed(() => employees.value.filter((employee) => employee.active && employee.roles.includes("rider")));
  const riderOptions = computed(() => riders.value.map((rider) => ({ value: rider.id, label: rider.name })));

  function findEmployee(id: string) {
    return employees.value.find((employee) => employee.id === id);
  }

  function employeeName(id: string) {
    return findEmployee(id)?.name ?? "Unknown";
  }

  return { employees, riders, riderOptions, findEmployee, employeeName };
});
