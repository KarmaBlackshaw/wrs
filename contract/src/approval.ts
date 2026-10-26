import { z } from "zod";
import { idSchema, isoDateTimeSchema, pageQuerySchema } from "./common.ts";
import { customerSchema, waiverRequestSchema } from "./customer.ts";
import { loanSchema } from "./loan.ts";
import { syncConflictSchema } from "./sync.ts";
import { voidSchema } from "./void.ts";

export { waiverRequestRejectBodySchema as rejectBodySchema, type TWaiverRequestRejectBody as TRejectBody } from "./customer.ts";

export const approvalKindSchema = z.enum(["void", "loan", "waiver", "customer", "sync_conflict"]);
export const approvalStatusSchema = z.enum(["pending", "handled"]);
export const approvalDecisionSchema = z.enum(["approved", "rejected", "accepted", "voided"]);

const approvalOf = <K extends z.infer<typeof approvalKindSchema>, I extends z.ZodType>(kind: K, item: I) =>
  z.object({
    kind: z.literal(kind),
    id: idSchema,
    createdAt: isoDateTimeSchema,
    requestedByName: z.string(),
    status: approvalStatusSchema,
    decision: approvalDecisionSchema.nullable(),
    decidedByName: z.string().nullable(),
    decidedAt: isoDateTimeSchema.nullable(),
    decisionReason: z.string().nullable(),
    item,
  });

export const approvalSchema = z.discriminatedUnion("kind", [
  approvalOf("void", voidSchema),
  approvalOf("loan", loanSchema),
  approvalOf("waiver", waiverRequestSchema),
  approvalOf("customer", customerSchema),
  approvalOf("sync_conflict", syncConflictSchema),
]);

export const approvalListQuerySchema = pageQuerySchema.extend({ status: approvalStatusSchema.optional() });

export type TApprovalKind = z.infer<typeof approvalKindSchema>;
export type TApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type TApprovalDecision = z.infer<typeof approvalDecisionSchema>;
export type TApproval = z.infer<typeof approvalSchema>;
export type TApprovalListQuery = z.infer<typeof approvalListQuerySchema>;
