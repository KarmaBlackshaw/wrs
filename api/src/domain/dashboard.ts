import type { TDashboard } from "@wrs/contract/report";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { listApprovals } from "./approval.ts";
import { listCustomers } from "./customer.ts";
import { digestDay } from "./digest.ts";
import { allPages } from "./reports/allPages.ts";
import { listWaterReadings } from "./water.ts";

export const getDashboard = async (ctx: TCtx): Promise<TDashboard> => {
  const today = manilaToday(ctx.now);

  const [day, shortages, approvals, overdue, readings] = await Promise.all([
    digestDay(ctx, today),
    ctx.db("shortages").whereNull("deductedRunId").whereNull("dismissedAt").first(ctx.db.raw("count(*) as total")),
    listApprovals(ctx, { status: "pending", page: 1, pageSize: 1 }),
    listCustomers(ctx, { show: "overdue", page: 1, pageSize: 1 }),
    allPages((page) => listWaterReadings(ctx, { ...page, from: today, to: today })),
  ]);
  const { total: openShortages }: { total: number } = shortages;

  return {
    today: day,
    alerts: [
      { kind: "low_stock", count: day.lowStockCount },
      { kind: "maintenance_due", count: day.maintenanceDueCount },
      { kind: "tests_due", count: day.testsDueCount },
      { kind: "open_shortages", count: openShortages },
      { kind: "pending_approvals", count: approvals.total },
      { kind: "overdue_customers", count: overdue.total },
      { kind: "tds_out_of_range", count: readings.filter(({ isOutOfRange }) => isOutOfRange).length },
    ],
  };
};
