import type { TDigestDay, TReportQuery } from "@wrs/contract/report";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDate } from "../lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { listConsumables } from "./consumable.ts";
import { listMaintenance } from "./maintenance.ts";
import { allPages } from "./reports/allPages.ts";
import { cashierVarianceReport } from "./reports/cashierVariance.ts";
import { expensesReport } from "./reports/expenses.ts";
import { riderReconciliationReport } from "./reports/riderReconciliation.ts";
import { listSales } from "./sale.ts";
import { listLabTests } from "./water.ts";

const dueCounts = async (ctx: TCtx) => {
  const [consumables, maintenance, labTests] = await Promise.all([listConsumables(ctx), listMaintenance(ctx), allPages((page) => listLabTests(ctx, page))]);

  return {
    lowStockCount: consumables.filter(({ stockStatus }) => stockStatus === "reorder").length,
    maintenanceDueCount: maintenance.filter(({ status }) => status !== "ok").length,
    testsDueCount: labTests.filter(({ dueStatus }) => dueStatus === "due" || dueStatus === "overdue").length,
  };
};

export const digestDay = async (ctx: TCtx, date: string): Promise<TDigestDay> => {
  const { start, end } = manilaDayBounds(date);
  const range = { from: date, to: date };
  const asOf: TCtx = { ...ctx, now: new Date(Math.min(end.getTime() - 1, ctx.now.getTime())) };

  const [sales, credit, collected, expenses, cashier, rider, counts] = await Promise.all([
    listSales(ctx, { ...range, page: 1, pageSize: 1 }),
    listSales(ctx, { ...range, paymentType: "credit", page: 1, pageSize: 1 }),
    ctx
      .db("payments")
      .whereNull("voidedAt")
      .where("createdAt", ">=", start)
      .where("createdAt", "<", end)
      .first(ctx.db.raw("coalesce(sum(amount), 0) as amount")),
    expensesReport.summarize(ctx, range),
    cashierVarianceReport.summarize(ctx, range),
    riderReconciliationReport.summarize(ctx, range),
    dueCounts(asOf),
  ]);
  const { amount: collections }: { amount: number } = collected;

  return {
    date,
    salesCash: sales.totals.amount - credit.totals.amount,
    salesCredit: credit.totals.amount,
    collections,
    expenses: expenses.value ?? 0,
    variances: (cashier.value ?? 0) + (rider.value ?? 0),
    ...counts,
  };
};

export const digestDays = async (ctx: TCtx, { from, to }: Required<TReportQuery>): Promise<TDigestDay[]> => {
  const today = manilaToday(ctx.now);
  const last = to < today ? to : today;
  const days: TDigestDay[] = [];

  for (let date = from; date <= last; date = manilaDate(manilaDayBounds(date).end)) {
    days.push(await digestDay(ctx, date));
  }

  return days;
};
