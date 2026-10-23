import { priceAt as priceAtRule } from "@wrs/contract/rules/priceAt";
import {
  priceSchema,
  productSchema,
  type TPrice,
  type TPriceCreate,
  type TProduct,
  type TProductCreate,
  type TProductListQuery,
  type TProductUpdate,
} from "@wrs/contract/product";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { requireContainerType } from "./container-type.ts";

const pricesSchema = z.array(priceSchema);

const requireProduct = async (ctx: TCtx, id: string) => {
  const row = await ctx.db("products").where({ id }).forUpdate().first("id");

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Product not found.", details: { id } });
  }
};

const loadProducts = async (ctx: TCtx, scope: { id?: string; includeInactive?: boolean }): Promise<TProduct[]> => {
  const { id, includeInactive = false } = scope;
  const query = ctx.db("products").orderBy([{ column: "createdAt" }, { column: "id" }]);

  if (id) {
    query.where({ id });
  } else if (!includeInactive) {
    query.where({ active: true });
  }

  const products = await query;

  const prices = pricesSchema.parse(
    await ctx
      .db("prices")
      .whereIn(
        "productId",
        products.map((product) => product.id)
      )
      .orderBy("effectiveFrom")
  );
  const now = ctx.now.toISOString();

  return products.map((product) => {
    const own = prices.filter((price) => price.productId === product.id);

    return productSchema.parse({
      ...product,
      currentPrice: priceAtRule(own, now) ?? null,
      upcomingPrices: own.filter(({ effectiveFrom }) => effectiveFrom > now).map(({ amount, effectiveFrom }) => ({ amount, effectiveFrom })),
    });
  });
};

const loadProduct = async (ctx: TCtx, id: string) => {
  const [product] = await loadProducts(ctx, { id });

  return productSchema.parse(product);
};

export const listProducts = (ctx: TCtx, { includeInactive }: TProductListQuery) => loadProducts(ctx, { includeInactive: includeInactive === "yes" });

export const listPrices = async (ctx: TCtx, productId: string): Promise<TPrice[]> => {
  await requireProduct(ctx, productId);

  return pricesSchema.parse(await ctx.db("prices").where({ productId }).orderBy("effectiveFrom", "desc"));
};

export const createProduct = async (ctx: TCtx, { price, containerType, ...fields }: TProductCreate): Promise<TProduct> => {
  if (containerType) {
    await requireContainerType(ctx, containerType);
  }

  const id = await insertRecord(ctx, "products", { ...fields, containerType });

  await ctx.db("prices").insert({ productId: id, amount: price, effectiveFrom: ctx.now });

  return loadProduct(ctx, id);
};

export const updateProduct = async (ctx: TCtx, { id, ...fields }: TProductUpdate & { id: string }): Promise<TProduct> => {
  await requireProduct(ctx, id);

  if (fields.containerType) {
    await requireContainerType(ctx, fields.containerType);
  }

  if (Object.keys(fields).length > 0) {
    await ctx.db("products").where({ id }).update(fields);
  }

  return loadProduct(ctx, id);
};

export const addPrice = async (ctx: TCtx, { productId, amount, effectiveFrom }: TPriceCreate & { productId: string }): Promise<TPrice> => {
  await requireProduct(ctx, productId);

  const at = new Date(effectiveFrom);

  await ctx.db("prices").insert({ productId, amount, effectiveFrom: at }).onConflict(["productId", "effectiveFrom"]).merge(["amount"]);

  return priceSchema.parse(await ctx.db("prices").where({ productId, effectiveFrom: at }).first());
};

export const priceAt = async (ctx: TCtx, { productId, at }: { productId: string; at: Date }) =>
  priceAtRule(pricesSchema.parse(await ctx.db("prices").where({ productId })), at.toISOString());
