import type { TPayLine, TPayRun } from "@/types";

export const payRuns: TPayRun[] = [
  { id: "run-0", frequency: "semi-monthly", periodStart: "2026-08-16", periodEnd: "2026-08-31", status: "finalized" },
  { id: "run-1", frequency: "semi-monthly", periodStart: "2026-09-01", periodEnd: "2026-09-15", status: "finalized" },
  { id: "run-2", frequency: "semi-monthly", periodStart: "2026-09-16", periodEnd: "2026-09-30", status: "draft" },
];

export const payLines: TPayLine[] = [
  {
    runId: "run-1",
    employeeId: "emp-3",
    daysWorked: 13,
    delivered: 1380,
    base: 715000,
    incentive: 40000,
    adjustments: 0,
    deductions: [{ kind: "advance", refId: "loan-1", amount: 100000 }],
    net: 655000,
  },
  { runId: "run-1", employeeId: "emp-2", daysWorked: 13, delivered: 0, base: 292500, incentive: 0, adjustments: 0, deductions: [], net: 292500 },
  {
    runId: "run-2",
    employeeId: "emp-3",
    daysWorked: 8,
    delivered: 850,
    base: 440000,
    incentive: 25000,
    adjustments: 0,
    deductions: [{ kind: "shortage", refId: "short-1", amount: 0 }],
    net: 465000,
  },
  {
    runId: "run-0",
    employeeId: "emp-1",
    daysWorked: 13,
    delivered: 120,
    base: 1500000,
    incentive: 0,
    adjustments: 0,
    deductions: [{ kind: "advance", refId: "loan-4", amount: 200000 }],
    net: 1300000,
  },
  {
    runId: "run-1",
    employeeId: "emp-1",
    daysWorked: 13,
    delivered: 110,
    base: 1500000,
    incentive: 0,
    adjustments: 0,
    deductions: [{ kind: "loan", refId: "loan-5", amount: 212000 }],
    net: 1288000,
  },
];
