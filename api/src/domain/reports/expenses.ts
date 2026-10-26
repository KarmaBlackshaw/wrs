import type { TExpense, TExpenseSource } from "@wrs/contract/expense";
import type { Knex } from "knex";
import { expenseQuery } from "../expense.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

const SOURCE_LABEL: Record<TExpenseSource, string> = { drawer: "Drawer", owner: "Owner" };

const liveIn = (query: Knex.QueryBuilder, { from, to }: TRange) => query.whereNull("expenses.deletedAt").whereBetween("expenses.date", [from, to]);

export const expensesReport: TReportDefinition = {
  build: async (ctx, range) => {
    const expenses: TExpense[] = await liveIn(expenseQuery(ctx.db), range).orderBy([
      { column: "expenses.date", order: "desc" },
      { column: "expenses.createdAt", order: "desc" },
      { column: "expenses.id", order: "desc" },
    ]);

    return {
      columns: [
        { key: "date", label: "Date", align: "left", format: "date" },
        { key: "category", label: "Category", align: "left", format: "text" },
        { key: "amount", label: "Amount", align: "right", format: "money" },
        { key: "paidBy", label: "Paid by", align: "left", format: "text" },
        { key: "source", label: "Source", align: "left", format: "text" },
        { key: "note", label: "Note", align: "left", format: "text" },
      ],
      rows: expenses.map(({ date, categoryName, amount, paidByName, source, note }) => ({
        date,
        category: categoryName,
        amount,
        paidBy: paidByName,
        source: SOURCE_LABEL[source],
        note,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const totals: { amount: number; count: number } = await liveIn(ctx.db("expenses"), range).first(
      ctx.db.raw("coalesce(sum(expenses.amount), 0) as amount"),
      ctx.db.raw("count(*) as count")
    );

    return { slug: "expenses", value: totals.amount, count: totals.count, tone: "default" };
  },
};
