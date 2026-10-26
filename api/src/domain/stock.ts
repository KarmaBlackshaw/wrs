import { z } from "zod";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";

type TDb = TCtx["db"];

export type TStockKind = "restock" | "stock_take" | "usage" | "maintenance" | "void" | "expense_reversal";
export type TStockStatus = "ok" | "soon" | "reorder";

const usagesSchema = z.array(z.object({ consumableId: z.string(), qtyPerUnit: z.number() }));

const roundQty = (value: number) => Math.round(value * 1000) / 1000;

type TStockEntryInput = { consumableId: string; kind: TStockKind; qty: number; reason?: string; refType?: string; refId?: string };

export const addStockEntry = async (ctx: TCtx, { consumableId, kind, qty, reason, refType, refId }: TStockEntryInput) => {
  const consumable = await ctx.db("consumables").where({ id: consumableId }).first("id");

  if (!consumable) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Consumable not found.", details: { field: "consumableId" } });
  }

  return insertRecord(ctx, "stockEntries", {
    consumableId,
    kind,
    qty,
    reason: reason ?? null,
    refType: refType ?? null,
    refId: refId ?? null,
    createdBy: ctx.actor.id,
  });
};

export const deductUsage = async (ctx: TCtx, { productId, qty, refType, refId }: { productId: string; qty: number; refType: string; refId: string }) => {
  const usages = usagesSchema.parse(await ctx.db("productUsages").where({ productId }).select("consumableId", "qtyPerUnit"));

  await Promise.all(
    usages.map(({ consumableId, qtyPerUnit }) =>
      insertRecord(ctx, "stockEntries", {
        consumableId,
        kind: "usage",
        qty: roundQty(-qtyPerUnit * qty),
        reason: null,
        refType,
        refId,
        createdBy: ctx.actor.id,
      })
    )
  );
};

export const stockOnHandQuery = (db: TDb) =>
  db("consumables as c")
    .leftJoin("stockEntries as e", "e.consumableId", "c.id")
    .select("c.id as consumableId", db.raw("coalesce(sum(e.qty), 0) as on_hand"))
    .groupBy("c.id");

export const stockStatus = (onHand: number, reorderLevel: number): TStockStatus => {
  if (onHand <= reorderLevel) {
    return "reorder";
  }

  return onHand <= reorderLevel * 1.5 ? "soon" : "ok";
};
