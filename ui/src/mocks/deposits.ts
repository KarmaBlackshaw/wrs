import type { TDepositEntry } from "@/types";

export const depositEntries: TDepositEntry[] = [
  { id: "dep-1", customerId: "cust-1", containerType: "round", amount: 20000, kind: "collected", createdAt: "2026-08-01T09:00:00+08:00" },
  { id: "dep-2", customerId: "cust-2", containerType: "round", amount: 30000, kind: "collected", createdAt: "2026-08-05T09:00:00+08:00" },
  { id: "dep-3", customerId: "cust-9", containerType: "round", amount: 20000, kind: "collected", createdAt: "2026-09-27T09:00:00+08:00" },
  { id: "dep-4", customerId: "cust-6", containerType: "round", amount: 10000, kind: "refunded", createdAt: "2026-09-10T10:00:00+08:00" },
];
