import type { TPayment } from "@/types";

export const payments: TPayment[] = [
  { id: "pay-1", customerId: "cust-2", amount: 30000, collectedBy: "emp-3", source: "trip", createdAt: "2026-09-25T07:45:00+08:00" },
  { id: "pay-2", customerId: "cust-4", amount: 20000, collectedBy: "emp-2", source: "drawer", createdAt: "2026-09-26T11:00:00+08:00" },
  { id: "pay-3", customerId: "cust-8", amount: 15000, collectedBy: "emp-2", source: "drawer", createdAt: "2026-09-24T15:30:00+08:00" },
];
