import { z } from "zod";
import { containerTypeCodeSchema } from "./container.ts";
import { idSchema, isoDateTimeSchema, moneySchema } from "./common.ts";

export const productKindSchema = z.enum(["refill", "container", "bottled", "other"]);

const upcomingPriceSchema = z.object({ amount: moneySchema, effectiveFrom: isoDateTimeSchema });

export const productSchema = z.object({
  id: idSchema,
  name: z.string(),
  kind: productKindSchema,
  containerType: containerTypeCodeSchema.nullable(),
  active: z.boolean(),
  currentPrice: moneySchema.nullable(),
  upcomingPrices: z.array(upcomingPriceSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const priceSchema = z.object({ productId: idSchema, amount: moneySchema, effectiveFrom: isoDateTimeSchema });

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  kind: productKindSchema,
  containerType: containerTypeCodeSchema.optional(),
  price: moneySchema,
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  kind: productKindSchema.optional(),
  containerType: containerTypeCodeSchema.nullable().optional(),
  active: z.boolean().optional(),
});

export const priceCreateSchema = z.object({ amount: moneySchema, effectiveFrom: isoDateTimeSchema });

export const productListQuerySchema = z.object({ includeInactive: z.enum(["yes", "no"]).optional() });

export type TProductKind = z.infer<typeof productKindSchema>;
export type TProduct = z.infer<typeof productSchema>;
export type TPrice = z.infer<typeof priceSchema>;
export type TProductCreate = z.infer<typeof productCreateSchema>;
export type TProductUpdate = z.infer<typeof productUpdateSchema>;
export type TPriceCreate = z.infer<typeof priceCreateSchema>;
export type TProductListQuery = z.infer<typeof productListQuerySchema>;
