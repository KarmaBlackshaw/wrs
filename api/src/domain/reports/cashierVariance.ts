import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { drawerSessionQuery, drawerSummary, type TDrawerSessionRow } from "../drawer.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

const openedIn = (ctx: TCtx, { from, to }: TRange) =>
  drawerSessionQuery(ctx.db).where("drawerSessions.openedAt", ">=", manilaDayBounds(from).start).where("drawerSessions.openedAt", "<", manilaDayBounds(to).end);

export const cashierVarianceReport: TReportDefinition = {
  build: async (ctx, range) => {
    const rows: TDrawerSessionRow[] = await openedIn(ctx, range).orderBy([
      { column: "drawerSessions.openedAt", order: "desc" },
      { column: "drawerSessions.id", order: "desc" },
    ]);

    const sessions = await Promise.all(rows.map((row) => drawerSummary(ctx, row)));

    return {
      columns: [
        { key: "opened", label: "Opened", align: "left", format: "datetime" },
        { key: "cashier", label: "Cashier", align: "left", format: "text" },
        { key: "opening", label: "Opening", align: "right", format: "money" },
        { key: "expected", label: "Expected", align: "right", format: "money" },
        { key: "counted", label: "Counted", align: "right", format: "money" },
        { key: "variance", label: "Variance", align: "right", format: "money" },
      ],
      rows: sessions.map(({ openedAt, cashierName, openingCash, expectedCash, countedCash, variance }) => ({
        opened: openedAt,
        cashier: cashierName,
        opening: openingCash,
        expected: expectedCash,
        counted: countedCash,
        variance,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const totals: { variance: number; count: number } = await openedIn(ctx, range)
      .clearSelect()
      .whereNotNull("drawerSessions.closedAt")
      .first(ctx.db.raw("coalesce(sum(drawer_sessions.variance), 0) as variance"), ctx.db.raw("count(*) as count"));

    return { slug: "cashier-variance", value: totals.variance, count: totals.count, tone: totals.variance !== 0 ? "warn" : "default" };
  },
};
