import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema, moneySchema } from "./common.ts";
import { waiverRequestRejectBodySchema } from "./customer.ts";
import { payFrequencySchema } from "./employee.ts";

export const payRunStatusSchema = z.enum(["draft", "finalized"]);
export const payLineDeductionKindSchema = z.enum(["advance", "loan", "shortage", "credit", "unpaid_leave", "carry_over"]);

export const payRunSchema = z.object({
  id: idSchema,
  frequency: payFrequencySchema,
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  status: payRunStatusSchema,
  finalizedById: idSchema.nullable(),
  finalizedByName: z.string().nullable(),
  finalizedAt: isoDateTimeSchema.nullable(),
  grossTotal: moneySchema,
  deductionsTotal: moneySchema,
  netTotal: moneySchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const payLineDeductionSchema = z.object({
  kind: payLineDeductionKindSchema,
  amount: moneySchema,
  refId: idSchema.nullable(),
});

export const payLineAdjustmentSchema = z.object({
  id: idSchema,
  runId: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  amount: moneySchema,
  reason: z.string(),
  createdById: idSchema,
  createdByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const payLineSchema = z.object({
  runId: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  daysWorked: z.number().int(),
  daysWorkedOverride: z.number().int().nullable(),
  delivered: z.number().int(),
  base: moneySchema,
  incentive: moneySchema,
  adjustments: z.array(payLineAdjustmentSchema),
  adjustmentsTotal: moneySchema,
  deductions: z.array(payLineDeductionSchema),
  deductionsTotal: moneySchema,
  creditHeld: moneySchema,
  creditRecovered: moneySchema,
  paidLeaveDays: z.number().int(),
  unpaidLeaveDays: z.number().int(),
  carriedOver: moneySchema,
  gross: moneySchema,
  net: moneySchema,
});

export const payRunDetailSchema = payRunSchema.extend({ lines: z.array(payLineSchema) });

export const payRunCreateSchema = z.object({
  frequency: payFrequencySchema,
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
});

export const payLineDaysBodySchema = z.object({ daysWorked: z.number().int().min(0) });

export const payAdjustmentBodySchema = z.object({
  employeeId: idSchema,
  amount: moneySchema,
  reason: z.string().trim().min(1).max(255),
});

export const shortageExcludeBodySchema = waiverRequestRejectBodySchema;
export const shortageDismissBodySchema = waiverRequestRejectBodySchema;

export const payslipSchema = payLineSchema.extend({
  frequency: payFrequencySchema,
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  finalizedAt: isoDateTimeSchema,
});

export type TPayRunStatus = z.infer<typeof payRunStatusSchema>;
export type TPayLineDeductionKind = z.infer<typeof payLineDeductionKindSchema>;
export type TPayRun = z.infer<typeof payRunSchema>;
export type TPayLineDeduction = z.infer<typeof payLineDeductionSchema>;
export type TPayLineAdjustment = z.infer<typeof payLineAdjustmentSchema>;
export type TPayLine = z.infer<typeof payLineSchema>;
export type TPayRunDetail = z.infer<typeof payRunDetailSchema>;
export type TPayRunCreate = z.infer<typeof payRunCreateSchema>;
export type TPayLineDaysBody = z.infer<typeof payLineDaysBodySchema>;
export type TPayAdjustmentBody = z.infer<typeof payAdjustmentBodySchema>;
export type TShortageExcludeBody = z.infer<typeof shortageExcludeBodySchema>;
export type TShortageDismissBody = z.infer<typeof shortageDismissBodySchema>;
export type TPayslip = z.infer<typeof payslipSchema>;
