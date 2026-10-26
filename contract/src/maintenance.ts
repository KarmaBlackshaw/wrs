import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema, pageQuerySchema } from "./common.ts";

export const maintenanceStatusSchema = z.enum(["ok", "due", "overdue"]);

export const maintenanceItemSchema = z.object({
  consumableId: idSchema,
  name: z.string(),
  intervalLiters: z.number().int().nullable(),
  intervalDays: z.number().int().nullable(),
  lastReplacedAt: isoDateTimeSchema.nullable(),
  litersSince: z.number().int().nullable(),
  daysSince: z.number().int().nullable(),
  status: maintenanceStatusSchema,
});

export const maintenanceLogBodySchema = z.object({
  consumableId: idSchema,
  at: isoDateTimeSchema,
  meterLiters: z.number().int().min(0),
});

export const meterReadingSchema = z.object({
  id: idSchema,
  liters: z.number().int(),
  at: isoDateTimeSchema,
  loggedBy: idSchema,
  loggedByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const meterReadingBodySchema = z.object({ liters: z.number().int().min(0) });

export const meterReadingListQuerySchema = pageQuerySchema.extend({ date: isoDateSchema.optional() });

export type TMaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;
export type TMaintenanceItem = z.infer<typeof maintenanceItemSchema>;
export type TMaintenanceLogBody = z.infer<typeof maintenanceLogBodySchema>;
export type TMeterReading = z.infer<typeof meterReadingSchema>;
export type TMeterReadingBody = z.infer<typeof meterReadingBodySchema>;
export type TMeterReadingListQuery = z.infer<typeof meterReadingListQuerySchema>;
