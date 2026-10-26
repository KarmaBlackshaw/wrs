import type { TPayLineDeduction, TPayRun } from "@wrs/contract/payroll";
import type { TReportColumn } from "@wrs/contract/report";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { fullNameSql } from "../../lib/sql/fullNameSql.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

type TLineRow = Pick<TPayRun, "periodStart" | "periodEnd"> & {
  employeeName: string;
  base: number;
  incentive: number;
  deductions: TPayLineDeduction[];
  net: number;
};

const COLUMNS: TReportColumn[] = [
  { key: "period", label: "Period", align: "left", format: "text" },
  { key: "employee", label: "Employee", align: "left", format: "text" },
  { key: "base", label: "Base", align: "right", format: "money" },
  { key: "incentive", label: "Incentive", align: "right", format: "money" },
  { key: "deductions", label: "Deductions", align: "right", format: "money" },
  { key: "net", label: "Net", align: "right", format: "money" },
];

const lines = ({ db }: TCtx, { from, to }: TRange): Promise<TLineRow[]> =>
  db("payLines as l")
    .join("payRuns as r", "r.id", "l.runId")
    .join("employees as e", "e.id", "l.employeeId")
    .where("r.status", "finalized")
    .where("r.periodStart", "<=", to)
    .where("r.periodEnd", ">=", from)
    .select("r.periodStart", "r.periodEnd", db.raw(`${fullNameSql("e")} as employee_name`), "l.base", "l.incentive", "l.deductions", "l.net")
    .orderBy([{ column: "r.periodStart", order: "desc" }, { column: "r.id" }, { column: "e.lastName" }, { column: "e.firstName" }]);

export const payrollSummaryReport: TReportDefinition = {
  build: async (ctx, range) => {
    const rows = await lines(ctx, range);

    return {
      columns: COLUMNS,
      rows: rows.map(({ periodStart, periodEnd, employeeName, base, incentive, deductions, net }) => ({
        period: `${periodStart} - ${periodEnd}`,
        employee: employeeName,
        base,
        incentive,
        deductions: deductions.reduce((sum, { amount }) => sum + amount, 0),
        net,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const rows = await lines(ctx, range);

    return { slug: "payroll-summary", value: rows.reduce((sum, { net }) => sum + net, 0), count: rows.length, tone: "default" };
  },
};
