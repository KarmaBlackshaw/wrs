import { z } from "zod";
import { dateRangeQuerySchema, errorCodeSchema, idSchema, isoDateTimeSchema, moneySchema, pageOf, pageQuerySchema } from "./common.ts";
import { depositSubBodySchema } from "./deposit.ts";
import { paymentMethodSchema } from "./payment.ts";

export const paymentTypeSchema = z.enum(["cash", "e_wallet", "credit"]);
export const saleSourceSchema = z.enum(["delivery", "walk_in"]);
export const voidStatusSchema = z.enum(["none", "pending", "voided"]);

export const walkInSaleLineSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  qty: z.number().int(),
  unitPrice: moneySchema,
  borrowed: z.number().int(),
  returned: z.number().int(),
});

export const walkInSaleSchema = z.object({
  id: idSchema,
  drawerSessionId: idSchema,
  customerId: idSchema.nullable(),
  customerName: z.string().nullable(),
  byName: z.string(),
  lines: z.array(walkInSaleLineSchema),
  amount: moneySchema,
  paymentType: paymentTypeSchema,
  voidedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const walkInSaleBodySchema = z.object({
  customerId: idSchema.optional(),
  lines: z.array(z.object({ productId: idSchema, qty: z.number().int().min(1), borrowed: z.number().int().min(0), returned: z.number().int().min(0) })).min(1),
  paymentType: paymentTypeSchema,
  deposit: depositSubBodySchema.optional(),
});

export const walkInSaleQuoteBodySchema = walkInSaleBodySchema.extend({ depositMethod: paymentMethodSchema.optional() });

export const walkInSaleQuoteSchema = z.object({
  lines: z.array(walkInSaleLineSchema.extend({ lineTotal: moneySchema })),
  amount: moneySchema,
  depositDue: moneySchema,
  depositLines: z.array(depositSubBodySchema.shape.lines.element),
  blockReason: z.object({ code: errorCodeSchema, message: z.string() }).nullable(),
});

export const saleRowSchema = z.object({
  id: idSchema,
  source: saleSourceSchema,
  createdAt: isoDateTimeSchema,
  customerName: z.string().nullable(),
  byName: z.string(),
  lines: z.array(z.object({ productId: idSchema, productName: z.string(), qty: z.number().int() })),
  amount: moneySchema,
  paymentType: paymentTypeSchema,
  voidStatus: voidStatusSchema,
});

export const salesListQuerySchema = pageQuerySchema.extend({
  ...dateRangeQuerySchema.shape,
  paymentType: paymentTypeSchema.optional(),
  source: saleSourceSchema.optional(),
});

export const salesPageSchema = pageOf(saleRowSchema).extend({ totals: z.object({ amount: moneySchema, count: z.number().int() }) });

export type TPaymentType = z.infer<typeof paymentTypeSchema>;
export type TSaleSource = z.infer<typeof saleSourceSchema>;
export type TVoidStatus = z.infer<typeof voidStatusSchema>;
export type TWalkInSaleLine = z.infer<typeof walkInSaleLineSchema>;
export type TWalkInSale = z.infer<typeof walkInSaleSchema>;
export type TWalkInSaleBody = z.infer<typeof walkInSaleBodySchema>;
export type TWalkInSaleQuoteBody = z.infer<typeof walkInSaleQuoteBodySchema>;
export type TWalkInSaleQuote = z.infer<typeof walkInSaleQuoteSchema>;
export type TSaleRow = z.infer<typeof saleRowSchema>;
export type TSalesListQuery = z.infer<typeof salesListQuerySchema>;
export type TSalesPage = z.infer<typeof salesPageSchema>;
