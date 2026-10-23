import { z } from "zod";
import { idSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";
import { containerTypeCodeSchema } from "./container.ts";
import { paymentMethodSchema } from "./payment.ts";

export const depositKindSchema = z.enum(["collected", "refunded", "forfeited", "waived"]);

export const depositEntrySchema = z.object({
  id: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  containerType: containerTypeCodeSchema,
  qty: z.number().int(),
  amount: moneySchema,
  kind: depositKindSchema,
  method: paymentMethodSchema.nullable(),
  tripId: idSchema.nullable(),
  drawerSessionId: idSchema.nullable(),
  refType: z.string().nullable(),
  refId: idSchema.nullable(),
  createdBy: idSchema,
  byName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const depositSubBodySchema = z.object({
  method: paymentMethodSchema,
  lines: z.array(z.object({ containerType: containerTypeCodeSchema, qty: z.number().int().min(1), amount: moneySchema.min(0) })).min(1),
});

export const depositListQuerySchema = pageQuerySchema.extend({ customerId: idSchema.optional() });

export type TDepositKind = z.infer<typeof depositKindSchema>;
export type TDepositEntry = z.infer<typeof depositEntrySchema>;
export type TDepositSubBody = z.infer<typeof depositSubBodySchema>;
export type TDepositListQuery = z.infer<typeof depositListQuerySchema>;
