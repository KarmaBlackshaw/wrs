import { z } from "zod";
import { dateRangeQuerySchema, idSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";
import { depositSubBodySchema } from "./deposit.ts";
import { paymentTypeSchema } from "./sale.ts";

export const tripStatusSchema = z.enum(["open", "returning", "returned", "reconciled"]);

export const tripSchema = z.object({
  id: idSchema,
  riderId: idSchema,
  riderName: z.string(),
  createdBy: idSchema,
  createdByName: z.string(),
  status: tripStatusSchema,
  loadedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.nullable(),
  returnedAt: isoDateTimeSchema.nullable(),
  receivedBy: idSchema.nullable(),
  receivedByName: z.string().nullable(),
  receivedDrawerSessionId: idSchema.nullable(),
  reconciledBy: idSchema.nullable(),
  reconciledByName: z.string().nullable(),
  reconciledAt: isoDateTimeSchema.nullable(),
  expectedCash: moneySchema,
  cashRemitted: moneySchema.nullable(),
  cashVariance: moneySchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const tripLineSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  unitPrice: moneySchema,
  loaded: z.number().int(),
  delivered: z.number().int(),
  remaining: z.number().int(),
  expectedFull: z.number().int(),
  returnedFull: z.number().int().nullable(),
  emptiesCollected: z.number().int(),
  returnedEmpty: z.number().int().nullable(),
  varianceFull: z.number().int().nullable(),
  varianceEmpty: z.number().int().nullable(),
});

export const deliveryLineSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  qty: z.number().int(),
  unitPrice: moneySchema,
  emptiesCollected: z.number().int(),
});

export const deliverySchema = z.object({
  id: idSchema,
  tripId: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  riderName: z.string(),
  lines: z.array(deliveryLineSchema),
  amount: moneySchema,
  paymentType: paymentTypeSchema,
  depositCollected: moneySchema,
  voidedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const tripDetailSchema = tripSchema.extend({ lines: z.array(tripLineSchema), deliveries: z.array(deliverySchema), hasShortage: z.boolean() });

export const tripListQuerySchema = pageQuerySchema.extend({
  ...dateRangeQuerySchema.shape,
  status: tripStatusSchema.optional(),
  riderId: idSchema.optional(),
});

export const loadOutBodySchema = z.object({
  riderId: idSchema,
  lines: z.array(z.object({ productId: idSchema, loaded: z.number().int().min(1) })).min(1),
});

export const receiveBodySchema = z.object({
  lines: z.array(z.object({ productId: idSchema, returnedFull: z.number().int().min(0), returnedEmpty: z.number().int().min(0) })).min(1),
  cashRemitted: moneySchema.min(0),
});

export const deliveryCreateSchema = z.object({
  id: idSchema,
  tripId: idSchema,
  customerId: idSchema,
  lines: z
    .array(z.object({ productId: idSchema, qty: z.number().int().min(1), emptiesCollected: z.number().int().min(0), unitPrice: moneySchema.min(0) }))
    .min(1),
  paymentType: paymentTypeSchema,
  deposit: depositSubBodySchema.optional(),
});

export const deliveryListQuerySchema = pageQuerySchema.extend({ customerId: idSchema.optional(), tripId: idSchema.optional() });

export type TTripStatus = z.infer<typeof tripStatusSchema>;
export type TTrip = z.infer<typeof tripSchema>;
export type TTripLine = z.infer<typeof tripLineSchema>;
export type TDeliveryLine = z.infer<typeof deliveryLineSchema>;
export type TDelivery = z.infer<typeof deliverySchema>;
export type TTripDetail = z.infer<typeof tripDetailSchema>;
export type TTripListQuery = z.infer<typeof tripListQuerySchema>;
export type TLoadOutBody = z.infer<typeof loadOutBodySchema>;
export type TReceiveBody = z.infer<typeof receiveBodySchema>;
export type TDeliveryCreate = z.infer<typeof deliveryCreateSchema>;
export type TDeliveryListQuery = z.infer<typeof deliveryListQuerySchema>;
