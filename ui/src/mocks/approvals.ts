import type { TApproval } from "@/types";

export const approvals: TApproval[] = [
  {
    id: "appr-1",
    kind: "void",
    refId: "void-2",
    summary: "Void delivery del-2, customer disputes quantity delivered",
    requestedBy: "emp-3",
    createdAt: "2026-09-26T08:00:00+08:00",
  },
  {
    id: "appr-2",
    kind: "loan",
    refId: "loan-3",
    summary: "Boyet Reyes requests a loan of ₱5,000.00 over 3 months",
    requestedBy: "emp-5",
    createdAt: "2026-09-26T14:00:00+08:00",
  },
  {
    id: "appr-3",
    kind: "credit",
    refId: "cust-11",
    summary: "Josefina Ramos requests credit enrollment",
    requestedBy: "emp-2",
    createdAt: "2026-09-27T09:30:00+08:00",
  },
  {
    id: "appr-4",
    kind: "waiver",
    refId: "cust-7",
    summary: "Corazon Ferrer requests deposit waiver",
    requestedBy: "emp-2",
    createdAt: "2026-09-27T10:00:00+08:00",
  },
];
