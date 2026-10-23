import { randomUUID } from "node:crypto";
import type { TCtx } from "./makeCtx.ts";

export const insertRecord = async (ctx: TCtx, table: string, row: Record<string, unknown> & { id?: string }) => {
  const id = row.id ?? randomUUID();

  await ctx.db(table).insert({ ...row, id, createdAt: ctx.now });

  return id;
};
