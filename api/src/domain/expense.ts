import { randomUUID } from "node:crypto";
import type { TExpense, TExpenseCreate, TExpenseListQuery, TExpensePage, TExpenseUpdate } from "@wrs/contract/expense";
import type { Knex } from "knex";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { requireOpen } from "./drawer.ts";
import { addStockEntry } from "./stock.ts";

export const expenseQuery = (db: TCtx["db"]) =>
  db("expenses")
    .join("expenseCategories", "expenseCategories.id", "expenses.categoryId")
    .join("employees", "employees.id", "expenses.paidBy")
    .select(
      "expenses.id",
      "expenses.categoryId",
      "expenseCategories.name as categoryName",
      "expenses.amount",
      "expenses.date",
      "expenses.paidBy",
      db.raw(`${fullNameSql("employees")} as paid_by_name`),
      "expenses.source",
      "expenses.drawerSessionId",
      "expenses.receiptFileId",
      "expenses.note",
      "expenses.consumableId",
      "expenses.qty",
      "expenses.refType",
      "expenses.refId",
      "expenses.deletedAt",
      "expenses.deletedBy",
      "expenses.createdAt",
      "expenses.updatedAt"
    );

type TExpenseRow = Pick<TExpense, "id" | "amount" | "source" | "drawerSessionId" | "consumableId" | "qty">;

const loadExpense = async (ctx: TCtx, id: string) => {
  const expense: TExpense = await expenseQuery(ctx.db).where("expenses.id", id).first();

  return expense;
};

const requireExists = async (ctx: TCtx, { table, id, field }: { table: string; id: string; field: string }) => {
  const row = await ctx.db(table).where({ id }).first("id");

  if (!row) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Referenced record not found.", details: { field } });
  }
};

export const createExpense = async (ctx: TCtx, { categoryId, amount, note, consumableId, qty, receiptFileId }: TExpenseCreate): Promise<TExpense> => {
  const isDrawer = ctx.actor.activeRole === "cashier";
  const drawer = isDrawer ? await requireOpen(ctx) : undefined;
  const id = randomUUID();

  await requireExists(ctx, { table: "expenseCategories", id: categoryId, field: "categoryId" });

  if (receiptFileId) {
    await requireExists(ctx, { table: "files", id: receiptFileId, field: "receiptFileId" });
  }

  if (consumableId && qty) {
    await addStockEntry(ctx, { consumableId, kind: "restock", qty, refType: "expense", refId: id });
  }

  await insertRecord(ctx, "expenses", {
    id,
    categoryId,
    amount,
    date: manilaToday(ctx.now),
    paidBy: ctx.actor.id,
    source: isDrawer ? "drawer" : "owner",
    drawerSessionId: drawer?.id ?? null,
    receiptFileId: receiptFileId ?? null,
    note: note ?? null,
    consumableId: consumableId ?? null,
    qty: qty ?? null,
  });

  return loadExpense(ctx, id);
};

const filterExpenses = (query: Knex.QueryBuilder, { month, categoryId }: Pick<TExpenseListQuery, "month" | "categoryId">) => {
  query.whereNull("expenses.deletedAt");

  if (month) {
    query.whereRaw("date_format(expenses.date, '%Y-%m') = ?", [month]);
  }

  if (categoryId) {
    query.where("expenses.categoryId", categoryId);
  }

  return query;
};

export const listExpenses = async (ctx: TCtx, { page, pageSize, ...filters }: TExpenseListQuery): Promise<TExpensePage> => {
  const query = filterExpenses(expenseQuery(ctx.db), filters).orderBy([
    { column: "expenses.date", order: "desc" },
    { column: "expenses.createdAt", order: "desc" },
    { column: "expenses.id", order: "desc" },
  ]);

  const result = await paginate<TExpense>(query, { page, pageSize });
  const totals: TExpensePage["totals"] = await filterExpenses(ctx.db("expenses"), filters).first(ctx.db.raw("coalesce(sum(expenses.amount), 0) as amount"));

  return { ...result, totals };
};

const requireLive = async (ctx: TCtx, id: string) => {
  const row: TExpenseRow | undefined = await ctx
    .db("expenses")
    .where({ id })
    .whereNull("deletedAt")
    .forUpdate()
    .first("id", "amount", "source", "drawerSessionId", "consumableId", "qty");

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Expense not found." });
  }

  return row;
};

const requireAmountEditable = async (ctx: TCtx, { source, drawerSessionId }: TExpenseRow) => {
  if (source === "owner") {
    return;
  }

  const session: { closedAt: string | null } | undefined = drawerSessionId
    ? await ctx.db("drawerSessions").where({ id: drawerSessionId }).forUpdate().first("closedAt")
    : undefined;

  if (!session || session.closedAt != null) {
    throw domainError({
      statusCode: 409,
      code: "expense.session_closed",
      message: "This drawer session is closed. Only category, note and receipt can change.",
    });
  }
};

const reverseRestock = async (ctx: TCtx, { id, consumableId, qty }: TExpenseRow) => {
  if (consumableId != null && qty != null) {
    await addStockEntry(ctx, { consumableId, kind: "expense_reversal", qty: -qty, refType: "expense", refId: id });
  }
};

export const updateExpense = async (ctx: TCtx, { id, ...fields }: TExpenseUpdate & { id: string }): Promise<TExpense> => {
  const current = await requireLive(ctx, id);
  const amount = fields.amount ?? current.amount;
  const consumableId = fields.consumableId ?? current.consumableId;
  const qty = fields.qty ?? current.qty;
  const isRestockChanged = consumableId !== current.consumableId || qty !== current.qty;

  if (isRestockChanged || amount !== current.amount) {
    await requireAmountEditable(ctx, current);
  }

  if ((consumableId == null) !== (qty == null)) {
    throw domainError({
      statusCode: 422,
      code: "validation",
      message: "Consumable and qty go together.",
      details: { field: consumableId == null ? "consumableId" : "qty" },
    });
  }

  if (fields.categoryId) {
    await requireExists(ctx, { table: "expenseCategories", id: fields.categoryId, field: "categoryId" });
  }

  if (fields.receiptFileId) {
    await requireExists(ctx, { table: "files", id: fields.receiptFileId, field: "receiptFileId" });
  }

  if (isRestockChanged) {
    await reverseRestock(ctx, current);

    if (consumableId != null && qty != null) {
      await addStockEntry(ctx, { consumableId, kind: "restock", qty, refType: "expense", refId: id });
    }
  }

  if (Object.keys(fields).length > 0) {
    await ctx.db("expenses").where({ id }).update(fields);
  }

  return loadExpense(ctx, id);
};

export const deleteExpense = async (ctx: TCtx, id: string): Promise<TExpense> => {
  const current = await requireLive(ctx, id);

  await reverseRestock(ctx, current);
  await ctx.db("expenses").where({ id }).update({ deletedAt: ctx.now, deletedBy: ctx.actor.id });

  return loadExpense(ctx, id);
};
