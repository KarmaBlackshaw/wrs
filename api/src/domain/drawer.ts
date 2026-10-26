import type { TDrawerBreakdown, TDrawerCloseBody, TDrawerOpenBody, TDrawerSession } from "@wrs/contract/drawer";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";

export type TDrawerSessionRow = Omit<TDrawerSession, "expectedCash"> & { expectedCash: number | null };

type TBreakdownTerms = Omit<TDrawerBreakdown, "expected">;

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Drawer session not found." });

export const drawerSessionQuery = (db: TCtx["db"]) =>
  db("drawerSessions")
    .join("employees", "employees.id", "drawerSessions.cashierId")
    .select(
      "drawerSessions.id",
      "drawerSessions.cashierId",
      db.raw(`${fullNameSql("employees")} as cashier_name`),
      "drawerSessions.openedAt",
      "drawerSessions.openingCash",
      "drawerSessions.closedAt",
      "drawerSessions.countedCash",
      "drawerSessions.expectedCash",
      "drawerSessions.variance",
      "drawerSessions.createdAt",
      "drawerSessions.updatedAt"
    );

const findSession = async (db: TCtx["db"], id: string) => {
  const row: TDrawerSessionRow | undefined = await drawerSessionQuery(db).where("drawerSessions.id", id).first();

  if (!row) {
    throw notFound();
  }

  return row;
};

export const drawerBreakdown = async (ctx: TCtx, sessionId: string): Promise<TDrawerBreakdown> => {
  const { db } = ctx;

  const sum = (table: string, column: string, where: Record<string, string | null>) =>
    db(table)
      .where(where)
      .select(db.raw("coalesce(sum(??), 0)", [column]));

  const terms: TBreakdownTerms | undefined = await db("drawerSessions")
    .where({ id: sessionId })
    .first(
      "openingCash as opening",
      sum("walkInSales", "amount", { drawerSessionId: sessionId, paymentType: "cash", voidedAt: null }).as("cashWalkIns"),
      sum("depositEntries", "amount", { drawerSessionId: sessionId, kind: "collected", method: "cash" }).as("cashDeposits"),
      sum("payments", "amount", { drawerSessionId: sessionId, method: "cash", voidedAt: null }).as("cashPayments"),
      sum("trips", "cashRemitted", { receivedDrawerSessionId: sessionId }).as("riderRemittances"),
      sum("expenses", "amount", { drawerSessionId: sessionId, source: "drawer", deletedAt: null }).as("drawerExpenses"),
      sum("depositEntries", "amount", { drawerSessionId: sessionId, kind: "refunded", method: "cash" }).as("depositRefunds"),
      sum("voidRefunds", "amount", { drawerSessionId: sessionId, method: "cash" }).as("voidRefunds")
    );

  if (!terms) {
    throw notFound();
  }

  const { opening, cashWalkIns, cashDeposits, cashPayments, riderRemittances, drawerExpenses, depositRefunds, voidRefunds } = terms;

  return {
    ...terms,
    expected: opening + cashWalkIns + cashDeposits + cashPayments + riderRemittances - drawerExpenses - depositRefunds - voidRefunds,
  };
};

export const drawerSummary = async (ctx: TCtx, session: TDrawerSessionRow): Promise<TDrawerSession> => {
  if (session.closedAt != null && session.expectedCash != null) {
    return { ...session, expectedCash: session.expectedCash };
  }

  const { expected } = await drawerBreakdown(ctx, session.id);

  return { ...session, expectedCash: expected };
};

const loadSession = async (ctx: TCtx, id: string) => {
  const row = await findSession(ctx.db, id);

  return drawerSummary(ctx, row);
};

export const requireOpen = async (ctx: TCtx): Promise<TDrawerSession> => {
  const open: { id: string } | undefined = await ctx.db("drawerSessions").where({ cashierId: ctx.actor.id }).whereNull("closedAt").forUpdate().first("id");

  if (!open) {
    throw domainError({ statusCode: 409, code: "drawer.not_open", message: "Open your drawer first." });
  }

  return loadSession(ctx, open.id);
};

export const openDrawer = async (ctx: TCtx, { openingCash }: TDrawerOpenBody): Promise<TDrawerSession> => {
  await ctx.db("employees").where({ id: ctx.actor.id }).forUpdate().first("id");

  const existing: { id: string } | undefined = await ctx.db("drawerSessions").where({ cashierId: ctx.actor.id }).whereNull("closedAt").first("id");

  if (existing) {
    ctx.violation("drawer.open_exists", "You already have an open drawer.", { drawerSessionId: existing.id });
  }

  const id = await insertRecord(ctx, "drawerSessions", { cashierId: ctx.actor.id, openedAt: ctx.now, openingCash });

  return loadSession(ctx, id);
};

export const closeDrawer = async (ctx: TCtx, { countedCash }: TDrawerCloseBody): Promise<TDrawerSession> => {
  const { id, cashierId, expectedCash } = await requireOpen(ctx);
  const variance = countedCash - expectedCash;

  await ctx.db("drawerSessions").where({ id }).update({ closedAt: ctx.now, countedCash, expectedCash, variance });

  if (variance < 0) {
    await insertRecord(ctx, "shortages", { employeeId: cashierId, source: "drawer", refId: id, cash: -variance, containers: 0 });
  }

  return loadSession(ctx, id);
};
