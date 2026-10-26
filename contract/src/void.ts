import { z } from "zod";
import { idSchema, isoDateTimeSchema, moneySchema } from "./common.ts";
import { waiverRequestRejectBodySchema } from "./customer.ts";
import { voidRefundSchema } from "./drawer.ts";

export const voidRefTypeSchema = z.enum(["delivery", "walk_in_sale", "payment"]);
export const voidStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const voidSchema = z.object({
  id: idSchema,
  refType: voidRefTypeSchema,
  refId: idSchema,
  amount: moneySchema,
  summary: z.string(),
  reason: z.string(),
  requestedById: idSchema,
  requestedByName: z.string(),
  status: voidStatusSchema,
  approvedById: idSchema.nullable(),
  approvedByName: z.string().nullable(),
  decidedAt: isoDateTimeSchema.nullable(),
  decisionReason: z.string().nullable(),
  refund: voidRefundSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const voidBodySchema = waiverRequestRejectBodySchema.extend({
  refType: voidRefTypeSchema.exclude(["payment"]),
  refId: idSchema,
});

export type TVoidRefType = z.infer<typeof voidRefTypeSchema>;
export type TVoidStatus = z.infer<typeof voidStatusSchema>;
export type TVoid = z.infer<typeof voidSchema>;
export type TVoidBody = z.infer<typeof voidBodySchema>;
