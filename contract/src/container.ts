import { z } from "zod";
import { dateRangeQuerySchema, idSchema, isoDateSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";

export const containerTypeCodeSchema = z.enum(["round", "slim"]);
export const movementTypeSchema = z.enum(["purchased", "to_rider", "to_customer", "collected", "returned", "damaged", "lost", "retired", "filled"]);
export const locationKindSchema = z.enum(["station", "rider", "customer", "external"]);
export const manualMovementTypeSchema = z.enum(["damaged", "lost", "purchased", "retired"]);

export const containerTypeSchema = z.object({
  code: containerTypeCodeSchema,
  deliverable: z.boolean(),
  depositAmount: moneySchema,
});

export const containerTypeUpdateSchema = z.object({ depositAmount: moneySchema });

export const containerMovementSchema = z.object({
  id: idSchema,
  type: movementTypeSchema,
  containerType: containerTypeCodeSchema,
  qty: z.number().int(),
  full: z.boolean(),
  fromLocation: locationKindSchema,
  toLocation: locationKindSchema,
  fromLabel: z.string(),
  toLabel: z.string(),
  riderId: idSchema.nullable(),
  customerId: idSchema.nullable(),
  reason: z.string().nullable(),
  refType: z.string().nullable(),
  refId: idSchema.nullable(),
  createdBy: idSchema,
  createdByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const movementListQuerySchema = pageQuerySchema.extend({
  ...dateRangeQuerySchema.shape,
  type: movementTypeSchema.optional(),
  location: locationKindSchema.optional(),
  customerId: idSchema.optional(),
});

export const movementCreateSchema = z.object({
  type: manualMovementTypeSchema,
  containerType: containerTypeCodeSchema,
  qty: z.number().int().min(1),
  full: z.boolean(),
  reason: z.string().trim().min(1).max(255),
});

export const holdingSchema = z.object({
  locationKind: locationKindSchema,
  locationId: idSchema.nullable(),
  label: z.string(),
  containerType: containerTypeCodeSchema,
  full: z.number().int(),
  empty: z.number().int(),
});

export const holdingListQuerySchema = pageQuerySchema.extend({
  locationKind: locationKindSchema.optional(),
  containerType: containerTypeCodeSchema.optional(),
  at: isoDateSchema.optional(),
});

export const containerCountSchema = z.object({
  id: idSchema,
  date: isoDateSchema,
  containerType: containerTypeCodeSchema,
  full: z.number().int(),
  empty: z.number().int(),
  expectedFull: z.number().int(),
  expectedEmpty: z.number().int(),
  varianceFull: z.number().int(),
  varianceEmpty: z.number().int(),
  createdBy: idSchema,
  countedByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const containerCountListQuerySchema = pageQuerySchema.merge(dateRangeQuerySchema);

export const containerCountBodySchema = z.object({
  counts: z.array(z.object({ containerType: containerTypeCodeSchema, full: z.number().int().min(0), empty: z.number().int().min(0) })).min(1),
});

export const containerReturnBodySchema = z.object({
  customerId: idSchema,
  lines: z.array(z.object({ containerType: containerTypeCodeSchema, qty: z.number().int().min(1) })).min(1),
});

export const containerReturnQuoteSchema = z.object({
  lines: z.array(z.object({ containerType: containerTypeCodeSchema, qty: z.number().int(), refund: moneySchema })),
  refund: moneySchema,
  depositOnFile: moneySchema,
  isWaived: z.boolean(),
});

export type TContainerTypeCode = z.infer<typeof containerTypeCodeSchema>;
export type TMovementType = z.infer<typeof movementTypeSchema>;
export type TLocationKind = z.infer<typeof locationKindSchema>;
export type TContainerType = z.infer<typeof containerTypeSchema>;
export type TContainerTypeUpdate = z.infer<typeof containerTypeUpdateSchema>;
export type TContainerMovement = z.infer<typeof containerMovementSchema>;
export type TMovementListQuery = z.infer<typeof movementListQuerySchema>;
export type TMovementCreate = z.infer<typeof movementCreateSchema>;
export type THolding = z.infer<typeof holdingSchema>;
export type THoldingListQuery = z.infer<typeof holdingListQuerySchema>;
export type TContainerCount = z.infer<typeof containerCountSchema>;
export type TContainerCountListQuery = z.infer<typeof containerCountListQuerySchema>;
export type TContainerCountBody = z.infer<typeof containerCountBodySchema>;
export type TContainerReturnBody = z.infer<typeof containerReturnBodySchema>;
export type TContainerReturnQuote = z.infer<typeof containerReturnQuoteSchema>;
