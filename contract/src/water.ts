import { z } from "zod";
import { dateRangeQuerySchema, idSchema, isoDateSchema, isoDateTimeSchema, pageQuerySchema } from "./common.ts";
import { dueStatusSchema } from "./customer.ts";

export const waterReadingSchema = z.object({
  id: idSchema,
  tds: z.number(),
  ph: z.number().nullable(),
  at: isoDateTimeSchema,
  isOutOfRange: z.boolean(),
  loggedBy: idSchema,
  loggedByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const waterReadingBodySchema = z.object({
  tds: z.number().min(0),
  ph: z.number().min(0).max(14).optional(),
});

export const waterReadingListQuerySchema = pageQuerySchema.extend(dateRangeQuerySchema.shape);

export const labTestSchema = z.object({
  id: idSchema,
  type: z.string(),
  date: isoDateSchema,
  result: z.string(),
  fileId: idSchema,
  nextDue: isoDateSchema,
  dueStatus: dueStatusSchema,
  createdBy: idSchema,
  createdByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const labTestBodySchema = z.object({
  type: z.string().trim().min(1).max(255),
  date: isoDateSchema,
  result: z.string().trim().min(1).max(255),
  fileId: idSchema,
  nextDue: isoDateSchema,
});

export const labTestListQuerySchema = pageQuerySchema;

export type TWaterReading = z.infer<typeof waterReadingSchema>;
export type TWaterReadingBody = z.infer<typeof waterReadingBodySchema>;
export type TWaterReadingListQuery = z.infer<typeof waterReadingListQuerySchema>;
export type TLabTest = z.infer<typeof labTestSchema>;
export type TLabTestBody = z.infer<typeof labTestBodySchema>;
export type TLabTestListQuery = z.infer<typeof labTestListQuerySchema>;
