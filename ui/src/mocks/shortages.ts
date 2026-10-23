import type { TShortage } from "@/types";

export const shortages: TShortage[] = [
  { id: "short-1", employeeId: "emp-3", source: "trip", cash: 0, containers: 1, approvedForDeduction: false },
  { id: "short-2", employeeId: "emp-2", source: "drawer", cash: 50000, containers: 0, approvedForDeduction: true },
];
