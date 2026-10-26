import { expenseCategorySchema, type TExpenseCategory } from "@wrs/contract/expense";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";

export const listExpenseCategories = async (ctx: TCtx): Promise<TExpenseCategory[]> => {
  const rows = await ctx.db("expenseCategories").orderBy("name").select("id", "name", "active", "createdAt", "updatedAt");

  return z.array(expenseCategorySchema).parse(rows);
};
