import type { TDrawerCurrent, TDrawerSession, TDrawerSessionListQuery } from "@wrs/contract/drawer";
import type { TPage } from "@wrs/contract/common";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { paginate } from "../lib/page/paginate.ts";
import { drawerBreakdown, drawerSessionQuery, drawerSummary, type TDrawerSessionRow } from "./drawer.ts";
import { expenseQuery } from "./expense.ts";

export const currentDrawer = async (ctx: TCtx): Promise<TDrawerCurrent> => {
  const row: TDrawerSessionRow | undefined = await drawerSessionQuery(ctx.db)
    .where({ "drawerSessions.cashierId": ctx.actor.id })
    .whereNull("drawerSessions.closedAt")
    .first();

  if (!row) {
    return null;
  }

  const [session, breakdown, expenses] = await Promise.all([
    drawerSummary(ctx, row),
    drawerBreakdown(ctx, row.id),
    expenseQuery(ctx.db)
      .where({ "expenses.drawerSessionId": row.id, "expenses.source": "drawer" })
      .whereNull("expenses.deletedAt")
      .orderBy("expenses.createdAt", "desc"),
  ]);

  return { session, breakdown, expenses };
};

export const listDrawerSessions = async (ctx: TCtx, { from, to, cashierId, page, pageSize }: TDrawerSessionListQuery): Promise<TPage<TDrawerSession>> => {
  const query = drawerSessionQuery(ctx.db).orderBy("drawerSessions.openedAt", "desc");

  if (from) {
    query.where("drawerSessions.openedAt", ">=", manilaDayBounds(from).start);
  }

  if (to) {
    query.where("drawerSessions.openedAt", "<", manilaDayBounds(to).end);
  }

  if (cashierId) {
    query.where("drawerSessions.cashierId", cashierId);
  }

  const result = await paginate<TDrawerSessionRow>(query, { page, pageSize });

  return { ...result, items: await Promise.all(result.items.map((row) => drawerSummary(ctx, row))) };
};
