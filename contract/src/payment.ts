import { z } from "zod";
import { idSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";

export const paymentMethodSchema = z.enum(["cash", "e_wallet"]);
export const paymentSourceSchema = z.enum(["trip", "drawer"]);

export const paymentSchema = z.object({
  id: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  amount: moneySchema,
  method: paymentMethodSchema,
  source: paymentSourceSchema,
  tripId: idSchema.nullable(),
  drawerSessionId: idSchema.nullable(),
  collectedBy: idSchema,
  byName: z.string(),
  voidedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const paymentCreateSchema = z.object({
  id: idSchema.optional(),
  customerId: idSchema,
  amount: moneySchema.min(1),
  method: paymentMethodSchema,
  tripId: idSchema.optional(),
});

export const paymentListQuerySchema = pageQuerySchema.extend({ customerId: idSchema.optional() });

export type TPaymentMethod = z.infer<typeof paymentMethodSchema>;
export type TPaymentSource = z.infer<typeof paymentSourceSchema>;
export type TPayment = z.infer<typeof paymentSchema>;
export type TPaymentCreate = z.infer<typeof paymentCreateSchema>;
export type TPaymentListQuery = z.infer<typeof paymentListQuerySchema>;
