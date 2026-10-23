import type { TVoid } from "@/types";

export const voids: TVoid[] = [
  {
    id: "void-1",
    refType: "walkin",
    refId: "wi-2",
    reason: "Wrong product rung up",
    requestedBy: "emp-2",
    status: "approved",
    approvedBy: "emp-1",
    createdAt: "2026-09-24T12:00:00+08:00",
  },
  {
    id: "void-2",
    refType: "delivery",
    refId: "del-2",
    reason: "Customer disputes quantity delivered",
    requestedBy: "emp-3",
    status: "pending",
    createdAt: "2026-09-26T08:00:00+08:00",
  },
];
