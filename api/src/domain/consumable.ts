import type { TPage } from "@wrs/contract/common";
import {
  consumableSchema,
  productUsageSchema,
  type TConsumable,
  type TConsumableCreate,
  type TConsumableUpdate,
  type TStockEntry,
  type TStockEntryBody,
  type TStockEntryListQuery,
  type TUsagesPutBody,
} from "@wrs/contract/consumable";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { addStockEntry, roundQty, stockOnHandQuery, stockStatus } from "./stock.ts";

const usageRowsSchema = z.array(productUsageSchema.extend({ consumableId: z.string() }));
const onHandRowSchema = z.object({ onHand: z.number() });

const requireConsumable = async (ctx: TCtx, id: string) => {
  const row = await ctx.db("consumables").where({ id }).forUpdate().first("id");

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Consumable not found.", details: { id } });
  }
};

const loadConsumables = async (ctx: TCtx, id?: string): Promise<TConsumable[]> => {
  const query = ctx
    .db("consumables as c")
    .join(stockOnHandQuery(ctx.db).as("s"), "s.consumableId", "c.id")
    .select("c.*", "s.onHand")
    .orderBy([{ column: "c.createdAt" }, { column: "c.id" }]);

  if (id) {
    query.where("c.id", id);
  }

  const consumables = await query;

  const usages = usageRowsSchema.parse(
    await ctx
      .db("productUsages as u")
      .join("products as p", "p.id", "u.productId")
      .whereIn(
        "u.consumableId",
        consumables.map((consumable) => consumable.id)
      )
      .select("u.consumableId", "u.productId", "p.name as productName", "u.qtyPerUnit as qty")
      .orderBy([{ column: "p.createdAt" }, { column: "p.id" }])
  );

  return consumables.map((consumable) =>
    consumableSchema.parse({
      ...consumable,
      stockStatus: stockStatus(consumable.onHand, consumable.reorderLevel),
      usages: usages.filter(({ consumableId }) => consumableId === consumable.id),
    })
  );
};

const loadConsumable = async (ctx: TCtx, id: string) => {
  const [consumable] = await loadConsumables(ctx, id);

  return consumableSchema.parse(consumable);
};

export const listConsumables = (ctx: TCtx) => loadConsumables(ctx);

export const createConsumable = async (ctx: TCtx, { intervalLiters, intervalDays, ...fields }: TConsumableCreate): Promise<TConsumable> => {
  const id = await insertRecord(ctx, "consumables", { ...fields, intervalLiters: intervalLiters ?? null, intervalDays: intervalDays ?? null });

  return loadConsumable(ctx, id);
};

export const updateConsumable = async (ctx: TCtx, { id, ...fields }: TConsumableUpdate & { id: string }): Promise<TConsumable> => {
  await requireConsumable(ctx, id);

  if (Object.keys(fields).length > 0) {
    await ctx.db("consumables").where({ id }).update(fields);
  }

  return loadConsumable(ctx, id);
};

export const replaceUsages = async (ctx: TCtx, { id, usages }: TUsagesPutBody & { id: string }): Promise<TConsumable> => {
  await requireConsumable(ctx, id);

  const productIds = usages.map(({ productId }) => productId);

  if (new Set(productIds).size !== productIds.length) {
    throw domainError({ statusCode: 422, code: "validation", message: "Each product can appear only once.", details: { field: "usages" } });
  }

  const found = new Set((await ctx.db("products").whereIn("id", productIds).select("id")).map((product) => product.id));
  const missing = usages.findIndex(({ productId }) => !found.has(productId));

  if (missing !== -1) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Product not found.", details: { field: `usages.${missing}.productId` } });
  }

  await ctx.db("productUsages").where({ consumableId: id }).del();

  if (usages.length > 0) {
    await ctx.db("productUsages").insert(usages.map(({ productId, qty }) => ({ productId, consumableId: id, qtyPerUnit: qty })));
  }

  return loadConsumable(ctx, id);
};

const stockEntryQuery = (db: TCtx["db"]) =>
  db("stockEntries as s")
    .join("consumables as c", "c.id", "s.consumableId")
    .join("employees as e", "e.id", "s.createdBy")
    .select(
      "s.id",
      "s.consumableId",
      "c.name as consumableName",
      "s.kind",
      "s.qty",
      "s.reason",
      "s.refType",
      "s.refId",
      "s.createdBy",
      db.raw(`${fullNameSql("e")} as by_name`),
      "s.createdAt",
      "s.updatedAt"
    );

export const listStockEntries = (ctx: TCtx, { page, pageSize, consumableId }: TStockEntryListQuery): Promise<TPage<TStockEntry>> => {
  const query = stockEntryQuery(ctx.db).orderBy([
    { column: "s.createdAt", order: "desc" },
    { column: "s.id", order: "desc" },
  ]);

  if (consumableId) {
    query.where("s.consumableId", consumableId);
  }

  return paginate(query, { page, pageSize });
};

const stockTakeDelta = async (ctx: TCtx, { consumableId, counted }: { consumableId: string; counted: number }) => {
  const locked = await ctx.db("consumables").where({ id: consumableId }).forUpdate().first("id");

  if (!locked) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Consumable not found.", details: { field: "consumableId" } });
  }

  const { onHand } = onHandRowSchema.parse(await stockOnHandQuery(ctx.db).where("c.id", consumableId).first());

  return roundQty(counted - onHand);
};

export const recordStockEntry = async (ctx: TCtx, body: TStockEntryBody): Promise<TStockEntry> => {
  const { kind, consumableId, reason } = body;
  const qty = body.kind === "restock" ? body.qty : await stockTakeDelta(ctx, body);
  const id = await addStockEntry(ctx, { consumableId, kind, qty, reason });

  const entry: TStockEntry = await stockEntryQuery(ctx.db).where("s.id", id).first();

  return entry;
};
