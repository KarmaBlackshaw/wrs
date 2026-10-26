import { z } from "zod";
import { idSchema, isoDateTimeSchema, pageQuerySchema } from "./common.ts";

export const consumableKindSchema = z.enum(["per_unit", "maintenance", "general"]);
export const stockStatusSchema = z.enum(["ok", "soon", "reorder"]);
export const stockEntryKindSchema = z.enum(["restock", "stock_take", "usage", "maintenance", "void", "expense_reversal"]);

export const productUsageSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  qty: z.number(),
});

export const consumableSchema = z.object({
  id: idSchema,
  name: z.string(),
  unit: z.string(),
  kind: consumableKindSchema,
  reorderLevel: z.number(),
  intervalLiters: z.number().int().nullable(),
  intervalDays: z.number().int().nullable(),
  onHand: z.number(),
  stockStatus: stockStatusSchema,
  usages: z.array(productUsageSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const consumableCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  unit: z.string().trim().min(1).max(16),
  kind: consumableKindSchema,
  reorderLevel: z.number().min(0),
  intervalLiters: z.number().int().min(1).nullable().optional(),
  intervalDays: z.number().int().min(1).nullable().optional(),
});

export const consumableUpdateSchema = consumableCreateSchema.partial();

export const usagesPutBodySchema = z.object({
  usages: z.array(z.object({ productId: idSchema, qty: z.number().positive() })),
});

export const stockEntrySchema = z.object({
  id: idSchema,
  consumableId: idSchema,
  consumableName: z.string(),
  kind: stockEntryKindSchema,
  qty: z.number(),
  reason: z.string().nullable(),
  refType: z.string().nullable(),
  refId: idSchema.nullable(),
  createdBy: idSchema,
  byName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

const reasonSchema = z.string().trim().min(1).max(255);

export const stockEntryBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("restock"), consumableId: idSchema, qty: z.number().positive(), reason: reasonSchema.optional() }),
  z.object({ kind: z.literal("stock_take"), consumableId: idSchema, counted: z.number().min(0), reason: reasonSchema }),
]);

export const stockEntryListQuerySchema = pageQuerySchema.extend({ consumableId: idSchema.optional() });

export type TConsumableKind = z.infer<typeof consumableKindSchema>;
export type TStockStatus = z.infer<typeof stockStatusSchema>;
export type TStockEntryKind = z.infer<typeof stockEntryKindSchema>;
export type TProductUsage = z.infer<typeof productUsageSchema>;
export type TConsumable = z.infer<typeof consumableSchema>;
export type TConsumableCreate = z.infer<typeof consumableCreateSchema>;
export type TConsumableUpdate = z.infer<typeof consumableUpdateSchema>;
export type TUsagesPutBody = z.infer<typeof usagesPutBodySchema>;
export type TStockEntry = z.infer<typeof stockEntrySchema>;
export type TStockEntryBody = z.infer<typeof stockEntryBodySchema>;
export type TStockEntryListQuery = z.infer<typeof stockEntryListQuerySchema>;
