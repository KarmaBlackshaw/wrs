import { z } from "zod";
import { idSchema, isoDateTimeSchema, moneySchema } from "./common.ts";

export const shortageSourceSchema = z.enum(["trip", "drawer"]);
export const shortageStatusSchema = z.enum(["pending", "deducted", "dismissed"]);

export const shortageSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  source: shortageSourceSchema,
  refId: idSchema,
  cash: moneySchema,
  containers: z.number().int(),
  status: shortageStatusSchema,
  excludedRunId: idSchema.nullable(),
  exclusionReason: z.string().nullable(),
  deductedRunId: idSchema.nullable(),
  dismissedAt: isoDateTimeSchema.nullable(),
  dismissReason: z.string().nullable(),
  dismissedById: idSchema.nullable(),
  dismissedByName: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const shortageBodySchema = z.object({
  source: z.literal("trip"),
  refId: idSchema,
  cash: moneySchema.min(0),
  containers: z.number().int().min(0),
});

export type TShortageSource = z.infer<typeof shortageSourceSchema>;
export type TShortageStatus = z.infer<typeof shortageStatusSchema>;
export type TShortage = z.infer<typeof shortageSchema>;
export type TShortageBody = z.infer<typeof shortageBodySchema>;
