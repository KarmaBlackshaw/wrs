import { randomUUID } from "node:crypto";
import type { TExpense, TExpenseCreate } from "@wrs/contract/expense";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
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

  const expense: TExpense = await expenseQuery(ctx.db).where("expenses.id", id).first();

  return expense;
};
