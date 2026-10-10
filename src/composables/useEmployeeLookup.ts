import { employees } from "@/mocks/employees";

const riders = employees.filter((employee) => employee.active && employee.roles.includes("rider"));
const riderOptions = riders.map((rider) => ({ value: rider.id, label: rider.name }));

export function useEmployeeLookup() {
  function findEmployee(id: string) {
    return employees.find((employee) => employee.id === id);
  }

  function employeeName(id: string) {
    return findEmployee(id)?.name ?? "Unknown";
  }

  return { findEmployee, employeeName, riders, riderOptions };
}
