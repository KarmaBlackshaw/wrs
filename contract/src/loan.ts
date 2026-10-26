import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";
import { loanMethodSchema } from "./setting.ts";

export { loanMethodSchema, type TLoanMethod } from "./setting.ts";

export const loanTypeSchema = z.enum(["advance", "loan"]);
export const loanStatusSchema = z.enum(["requested", "approved", "rejected", "released", "paid"]);

export const installmentSchema = z.object({
  loanId: idSchema,
  seq: z.number().int(),
  due: isoDateSchema,
  principalPart: moneySchema,
  interestPart: moneySchema,
  paid: z.boolean(),
  payRunId: idSchema.nullable(),
});

export const loanSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  type: loanTypeSchema,
  principal: moneySchema,
  ratePct: z.number().min(0),
  method: loanMethodSchema.nullable(),
  termMonths: z.number().int().nullable(),
  status: loanStatusSchema,
  balance: moneySchema,
  nextInstallment: installmentSchema.nullable(),
  preview: z.object({ totalInterest: moneySchema, installment: moneySchema }),
  authorizationFileId: idSchema.nullable(),
  approvedById: idSchema.nullable(),
  approvedByName: z.string().nullable(),
  releasedAt: isoDateTimeSchema.nullable(),
  decidedAt: isoDateTimeSchema.nullable(),
  decisionReason: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const loanRequestSchema = z.object({
  type: loanTypeSchema,
  principal: moneySchema.min(1),
  termMonths: z.number().int().min(1).optional(),
});

export const loanReleaseBodySchema = z.object({ authorizationFileId: idSchema });

export const loanListQuerySchema = pageQuerySchema.extend({ status: loanStatusSchema.optional() });

export type TLoanType = z.infer<typeof loanTypeSchema>;
export type TLoanStatus = z.infer<typeof loanStatusSchema>;
export type TInstallment = z.infer<typeof installmentSchema>;
export type TLoan = z.infer<typeof loanSchema>;
export type TLoanRequest = z.infer<typeof loanRequestSchema>;
export type TLoanReleaseBody = z.infer<typeof loanReleaseBodySchema>;
export type TLoanListQuery = z.infer<typeof loanListQuerySchema>;
