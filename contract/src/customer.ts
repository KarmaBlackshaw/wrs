import { z } from "zod";
import { containerTypeCodeSchema } from "./container.ts";
import { idSchema, isoDateSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";

export const customerStatusSchema = z.enum(["pending", "active"]);
export const agingBucketSchema = z.enum(["current", "7", "15", "30+"]);
export const dueStatusSchema = z.enum(["due", "overdue", "not_due"]);
export const ownershipEventSchema = z.enum(["created", "claimed_by_delivery", "released", "released_early", "reassigned", "assigned"]);
export const waiverRequestStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const customerSchema = z.object({
  id: idSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  address: z.string(),
  status: customerStatusSchema,
  riderId: idSchema.nullable(),
  riderName: z.string().nullable(),
  deliveryIntervalDays: z.number().int().nullable(),
  creditEnabled: z.boolean(),
  creditLimitOverride: moneySchema.nullable(),
  creditLimit: moneySchema.nullable(),
  depositWaived: z.boolean(),
  heldByType: z.record(containerTypeCodeSchema, z.number().int()),
  containersHeld: z.number().int(),
  depositOnFile: moneySchema,
  creditBalance: moneySchema,
  agingBucket: agingBucketSchema.nullable(),
  lastDeliveredAt: isoDateTimeSchema.nullable(),
  nextDueOn: isoDateSchema.nullable(),
  dueStatus: dueStatusSchema,
  coverage: z.object({ coveringRiderId: idSchema, coveringRiderName: z.string(), from: isoDateSchema, until: isoDateSchema }).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const customerListQuerySchema = pageQuerySchema.extend({
  scope: z.enum(["mine", "all"]).optional(),
  show: z.enum(["all", "open", "pending", "overdue"]).optional(),
  riderId: idSchema.optional(),
  balance: z.enum(["any", "owing"]).optional(),
  aging: agingBucketSchema.optional(),
});

const deliveryIntervalDaysSchema = z.number().int().min(1).max(365);

export const customerCreateSchema = z.object({
  id: idSchema.optional(),
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(32),
  address: z.string().trim().min(1),
  riderId: idSchema.optional(),
  deliveryIntervalDays: deliveryIntervalDaysSchema.optional(),
  allowDuplicateName: z.boolean().optional(),
});

export const customerUpdateSchema = customerCreateSchema
  .pick({ firstName: true, lastName: true, phone: true, address: true, deliveryIntervalDays: true })
  .partial()
  .extend({ riderId: idSchema.nullable().optional() });

export const customerCreditBodySchema = z.object({ enabled: z.boolean(), limitOverride: moneySchema.min(0).nullable() });

export const customerWaiverBodySchema = z.object({ waived: z.boolean() });

export const customerReleaseBodySchema = z.object({ confirmEarly: z.boolean().optional() });

export const customerOwnershipSchema = z.object({
  id: idSchema,
  customerId: idSchema,
  event: ownershipEventSchema,
  riderId: idSchema.nullable(),
  riderName: z.string().nullable(),
  byId: idSchema,
  byName: z.string(),
  createdAt: isoDateTimeSchema,
});

export const customerOwnershipListQuerySchema = pageQuerySchema.omit({ q: true });

export const distributePreviewBodySchema = z.object({
  customerIds: z.array(idSchema).min(1),
  riderIds: z.array(idSchema).min(1),
});

export const distributeProposalSchema = z.array(
  z.object({
    customerId: idSchema,
    customerName: z.string(),
    fromRiderName: z.string().nullable(),
    toRiderId: idSchema,
    toRiderName: z.string(),
  })
);

export const distributeCommitSchema = z.object({
  assignments: z.array(z.object({ customerId: idSchema, riderId: idSchema })).min(1),
});

export const waiverRequestSchema = z.object({
  id: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  requestedById: idSchema,
  requestedByName: z.string(),
  status: waiverRequestStatusSchema,
  decisionReason: z.string().nullable(),
  decidedByName: z.string().nullable(),
  decidedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export const waiverRequestCreateSchema = z.object({ id: idSchema.optional(), customerId: idSchema });

export const waiverRequestRejectBodySchema = z.object({ reason: z.string().trim().min(1).max(255) });

export type TCustomerStatus = z.infer<typeof customerStatusSchema>;
export type TAgingBucket = z.infer<typeof agingBucketSchema>;
export type TDueStatus = z.infer<typeof dueStatusSchema>;
export type TOwnershipEvent = z.infer<typeof ownershipEventSchema>;
export type TWaiverRequestStatus = z.infer<typeof waiverRequestStatusSchema>;
export type TCustomer = z.infer<typeof customerSchema>;
export type TCustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type TCustomerCreate = z.infer<typeof customerCreateSchema>;
export type TCustomerUpdate = z.infer<typeof customerUpdateSchema>;
export type TCustomerCreditBody = z.infer<typeof customerCreditBodySchema>;
export type TCustomerWaiverBody = z.infer<typeof customerWaiverBodySchema>;
export type TCustomerReleaseBody = z.infer<typeof customerReleaseBodySchema>;
export type TCustomerOwnership = z.infer<typeof customerOwnershipSchema>;
export type TCustomerOwnershipListQuery = z.infer<typeof customerOwnershipListQuerySchema>;
export type TDistributePreviewBody = z.infer<typeof distributePreviewBodySchema>;
export type TDistributeProposal = z.infer<typeof distributeProposalSchema>;
export type TDistributeCommit = z.infer<typeof distributeCommitSchema>;
export type TWaiverRequest = z.infer<typeof waiverRequestSchema>;
export type TWaiverRequestCreate = z.infer<typeof waiverRequestCreateSchema>;
export type TWaiverRequestRejectBody = z.infer<typeof waiverRequestRejectBodySchema>;
