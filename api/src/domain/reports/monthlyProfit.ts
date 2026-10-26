import type { TCtx } from "../../lib/context/makeCtx.ts";
import { expensesReport } from "./expenses.ts";
import { salesReport } from "./sales.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

const monthStart = (month: string, offset: number) => {
  const [year = 0, index = 0] = month.split("-").map(Number);

  return new Date(Date.UTC(year, index - 1 + offset, 1));
};

const monthsIn = ({ from, to }: TRange) => {
  const months: string[] = [];

  for (let month = from.slice(0, 7); month <= to.slice(0, 7); month = monthStart(month, 1).toISOString().slice(0, 7)) {
    months.push(month);
  }

  return months;
};

const profitByMonth = (ctx: TCtx, range: TRange) =>
  Promise.all(
    monthsIn(range).map(async (month) => {
      const start = `${month}-01`;
      const end = new Date(monthStart(month, 1).getTime() - 1).toISOString().slice(0, 10);
      const clipped = { from: range.from > start ? range.from : start, to: range.to < end ? range.to : end };
      const [sales, expenses] = await Promise.all([salesReport.summarize(ctx, clipped), expensesReport.summarize(ctx, clipped)]);
      const salesTotal = sales.value ?? 0;
      const expensesTotal = expenses.value ?? 0;

      return { month, sales: salesTotal, expenses: expensesTotal, profit: salesTotal - expensesTotal };
    })
  );

export const monthlyProfitReport: TReportDefinition = {
  build: async (ctx, range) => ({
    columns: [
      { key: "month", label: "Month", align: "left", format: "text" },
      { key: "sales", label: "Sales", align: "right", format: "money" },
      { key: "expenses", label: "Expenses", align: "right", format: "money" },
      { key: "profit", label: "Profit", align: "right", format: "money" },
    ],
    rows: await profitByMonth(ctx, range),
  }),
  summarize: async (ctx, range) => {
    const months = await profitByMonth(ctx, range);
    const profit = months.reduce((sum, month) => sum + month.profit, 0);

    return { slug: "monthly-profit", value: profit, count: months.length, tone: profit < 0 ? "warn" : "default" };
  },
};
