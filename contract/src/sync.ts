import { z } from "zod";
import { errorCodeSchema, idSchema, isoDateTimeSchema } from "./common.ts";
import { containerTypeSchema } from "./container.ts";
import { customerCreateSchema, customerReleaseBodySchema, customerSchema, waiverRequestCreateSchema } from "./customer.ts";
import { paymentCreateSchema } from "./payment.ts";
import { productSchema } from "./product.ts";
import { deliveryCreateSchema, tripDetailSchema } from "./trip.ts";

export const syncOpKindSchema = z.enum(["customer.create", "customer.release", "delivery.create", "payment.create", "waiver_request.create", "trip.end"]);
export const syncConflictStatusSchema = z.enum(["pending", "accepted", "voided"]);

const syncOp = <K extends z.infer<typeof syncOpKindSchema>, P extends z.ZodType>(kind: K, payload: P) =>
  z.object({ opId: idSchema, occurredAt: isoDateTimeSchema, kind: z.literal(kind), payload });

export const syncOpSchema = z.discriminatedUnion("kind", [
  syncOp(
    "customer.create",
    customerCreateSchema.pick({ firstName: true, lastName: true, phone: true, address: true, deliveryIntervalDays: true }).extend({ id: idSchema })
  ),
  syncOp("customer.release", customerReleaseBodySchema.extend({ customerId: idSchema })),
  syncOp("delivery.create", deliveryCreateSchema),
  syncOp("payment.create", paymentCreateSchema.extend({ id: idSchema, tripId: idSchema })),
  syncOp("waiver_request.create", waiverRequestCreateSchema.extend({ id: idSchema })),
  syncOp("trip.end", z.object({ tripId: idSchema })),
]);

export const syncPushBodySchema = z.object({ ops: z.array(syncOpSchema).max(50) });

export const syncPushResultSchema = z.object({
  results: z.array(
    z.object({
      opId: idSchema,
      status: z.enum(["applied", "conflict"]),
      conflictId: idSchema.optional(),
      codes: z.array(errorCodeSchema).optional(),
    })
  ),
});

export const syncSnapshotQuerySchema = z.object({ cursor: isoDateTimeSchema.optional() });

export const syncSnapshotSchema = z.object({
  cursor: isoDateTimeSchema,
  trip: tripDetailSchema.nullable(),
  customers: z.array(customerSchema),
  products: z.array(productSchema),
  containerTypes: z.array(containerTypeSchema),
});

export const syncConflictSchema = z.object({
  conflictId: idSchema,
  opKind: syncOpKindSchema,
  codes: z.array(errorCodeSchema),
  riderName: z.string(),
  occurredAt: isoDateTimeSchema,
  summary: z.string(),
  refType: z.string().nullable(),
  refId: idSchema.nullable(),
  status: syncConflictStatusSchema,
});

export type TSyncOpKind = z.infer<typeof syncOpKindSchema>;
export type TSyncConflictStatus = z.infer<typeof syncConflictStatusSchema>;
export type TSyncOp = z.infer<typeof syncOpSchema>;
export type TSyncPushBody = z.infer<typeof syncPushBodySchema>;
export type TSyncPushResult = z.infer<typeof syncPushResultSchema>;
export type TSyncSnapshotQuery = z.infer<typeof syncSnapshotQuerySchema>;
export type TSyncSnapshot = z.infer<typeof syncSnapshotSchema>;
export type TSyncConflict = z.infer<typeof syncConflictSchema>;
