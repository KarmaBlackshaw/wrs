import type { TEmployee, TPayPlan } from "@/types";

export const employees: TEmployee[] = [
  { id: "emp-1", name: "Demo Owner", phone: "09171234567", roles: ["owner", "cashier", "rider", "washer", "helper"], active: true },
  { id: "emp-2", name: "Ligaya Santos", phone: "09182345678", roles: ["cashier"], active: true },
  { id: "emp-3", name: "Mario Cruz", phone: "09193456789", roles: ["rider"], active: true },
  { id: "emp-4", name: "Ramil Bautista", phone: "09204567890", roles: ["rider"], active: true },
  { id: "emp-5", name: "Boyet Reyes", phone: "09215678901", roles: ["washer"], active: true },
  { id: "emp-6", name: "Fernando Dela Cruz", phone: "09226789012", roles: ["helper"], active: true },
  { id: "emp-7", name: "Corazon Villanueva", phone: "09237890123", roles: ["cashier", "rider"], active: true },
];

export const payPlans: TPayPlan[] = [
  { employeeId: "emp-1", frequency: "semi-monthly", rateBasis: "per-period", baseRate: 1500000, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-2", frequency: "semi-monthly", rateBasis: "per-period", baseRate: 45000, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-3", frequency: "daily", rateBasis: "per-day", baseRate: 55000, quota: 100, incentivePerContainer: 500, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-4", frequency: "daily", rateBasis: "per-day", baseRate: 55000, quota: 100, incentivePerContainer: 500, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-5", frequency: "semi-monthly", rateBasis: "per-period", baseRate: 40000, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-6", frequency: "semi-monthly", rateBasis: "per-period", baseRate: 38000, effectiveFrom: "2026-01-01" },
  { employeeId: "emp-7", frequency: "daily", rateBasis: "per-day", baseRate: 55000, quota: 100, incentivePerContainer: 500, effectiveFrom: "2026-01-01" },
];
