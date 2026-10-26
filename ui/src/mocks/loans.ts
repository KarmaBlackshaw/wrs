import type { TInstallment, TLoan } from "@/types";

export const loans: TLoan[] = [
  {
    id: "loan-1",
    employeeId: "emp-3",
    type: "advance",
    principal: 100000,
    ratePct: 0,
    method: "flat",
    termMonths: 1,
    authorizationUrl: "/mocks/auth-loan-1.jpg",
    status: "released",
  },
  {
    id: "loan-2",
    employeeId: "emp-6",
    type: "loan",
    principal: 1000000,
    ratePct: 2,
    method: "diminishing",
    termMonths: 6,
    authorizationUrl: "/mocks/auth-loan-2.jpg",
    status: "released",
  },
  { id: "loan-3", employeeId: "emp-5", type: "loan", principal: 500000, ratePct: 2, method: "flat", termMonths: 3, status: "requested" },
  { id: "loan-4", employeeId: "emp-1", type: "advance", principal: 200000, ratePct: 0, method: "flat", termMonths: 1, status: "paid" },
  { id: "loan-5", employeeId: "emp-1", type: "loan", principal: 600000, ratePct: 2, method: "flat", termMonths: 3, status: "released" },
];

export const installments: TInstallment[] = [
  { loanId: "loan-2", seq: 1, due: "2026-09-15", principalPart: 166700, interestPart: 20000, paid: true },
  { loanId: "loan-2", seq: 2, due: "2026-09-30", principalPart: 166700, interestPart: 16667, paid: false },
  { loanId: "loan-2", seq: 3, due: "2026-10-15", principalPart: 166700, interestPart: 13334, paid: false },
  { loanId: "loan-5", seq: 1, due: "2026-09-15", principalPart: 200000, interestPart: 12000, paid: true },
  { loanId: "loan-5", seq: 2, due: "2026-10-15", principalPart: 200000, interestPart: 12000, paid: false },
  { loanId: "loan-5", seq: 3, due: "2026-11-15", principalPart: 200000, interestPart: 12000, paid: false },
];
