import { z } from "zod";
import { roleSchema } from "./auth.ts";
import { idSchema, isoDateSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";
import { DEDUCTION_CAP_PCT, PASSWORD_MIN_LENGTH } from "./rules/employeeLimits.ts";

export const payFrequencySchema = z.enum(["daily", "weekly", "semi_monthly", "monthly"]);
export const rateBasisSchema = z.enum(["per_day", "per_period"]);

export const employeeSchema = z.object({
  id: idSchema,
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  hireDate: isoDateSchema,
  active: z.boolean(),
  roles: z.array(roleSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const employeeListQuerySchema = pageQuerySchema.extend({
  role: roleSchema.optional(),
  active: z.enum(["active", "inactive", "all"]).optional(),
});

export const employeeOptionSchema = z.object({ id: idSchema, name: z.string() });

export const employeeOptionsQuerySchema = z.object({
  role: roleSchema.optional(),
  scope: z.enum(["all", "available_for_trip"]).optional(),
});

export const employeeCreateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  username: z.string().trim().min(1),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  roles: z.array(roleSchema).min(1),
  hireDate: isoDateSchema,
});

export const employeeUpdateSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  roles: z.array(roleSchema).min(1).optional(),
  active: z.boolean().optional(),
  hireDate: isoDateSchema.optional(),
});

export const employeePasswordBodySchema = z.object({ password: z.string().min(PASSWORD_MIN_LENGTH) });

const restWeekdaySchema = z.number().int().min(0).max(6);

export const payPlanSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  frequency: payFrequencySchema,
  rateBasis: rateBasisSchema,
  baseRate: moneySchema,
  quota: z.number().int().nullable(),
  incentivePerContainer: moneySchema.nullable(),
  deductionCapPct: z.number().nullable(),
  restWeekday: restWeekdaySchema.nullable(),
  ptoDaysOverride: z.number().int().nullable(),
  maxLoanAmountOverride: moneySchema.nullable(),
  effectiveFrom: isoDateSchema,
  effectiveTo: isoDateSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const payPlanCreateSchema = z.object({
  frequency: payFrequencySchema,
  rateBasis: rateBasisSchema,
  baseRate: moneySchema.min(0),
  quota: z.number().int().min(0).optional(),
  incentivePerContainer: moneySchema.min(0).optional(),
  deductionCapPct: z.number().min(DEDUCTION_CAP_PCT.min).max(DEDUCTION_CAP_PCT.max).optional(),
  restWeekday: restWeekdaySchema.optional(),
  ptoDaysOverride: z.number().int().min(0).optional(),
  maxLoanAmountOverride: moneySchema.min(0).optional(),
  effectiveFrom: isoDateSchema,
});

export const ptoBalanceSchema = z.object({
  year: z.number().int(),
  allowance: z.number().int(),
  used: z.number().int(),
  remaining: z.number().int(),
});

export const absenceSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  employeeName: z.string(),
  from: isoDateSchema,
  to: isoDateSchema,
  days: z.number().int(),
  createdByName: z.string(),
  createdAt: isoDateTimeSchema,
});

export const employeeDetailSchema = employeeSchema.extend({
  currentPlan: payPlanSchema.nullable(),
  planHistory: z.array(payPlanSchema),
  pto: ptoBalanceSchema,
  absences: z.array(absenceSchema),
});

export const coverageProposalSchema = z.array(
  z.object({ customerId: idSchema, customerName: z.string(), coveringRiderId: idSchema, coveringRiderName: z.string() })
);

export const absencePreviewBodySchema = z.object({ employeeId: idSchema, from: isoDateSchema, to: isoDateSchema });

export const absenceCreateSchema = absencePreviewBodySchema.extend({
  coverage: z.array(z.object({ customerId: idSchema, coveringRiderId: idSchema })),
});

export type TPayFrequency = z.infer<typeof payFrequencySchema>;
export type TRateBasis = z.infer<typeof rateBasisSchema>;
export type TEmployee = z.infer<typeof employeeSchema>;
export type TEmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type TEmployeeOption = z.infer<typeof employeeOptionSchema>;
export type TEmployeeOptionsQuery = z.infer<typeof employeeOptionsQuerySchema>;
export type TEmployeeCreate = z.infer<typeof employeeCreateSchema>;
export type TEmployeeUpdate = z.infer<typeof employeeUpdateSchema>;
export type TEmployeePasswordBody = z.infer<typeof employeePasswordBodySchema>;
export type TPayPlan = z.infer<typeof payPlanSchema>;
export type TPayPlanCreate = z.infer<typeof payPlanCreateSchema>;
export type TPtoBalance = z.infer<typeof ptoBalanceSchema>;
export type TAbsence = z.infer<typeof absenceSchema>;
export type TEmployeeDetail = z.infer<typeof employeeDetailSchema>;
export type TCoverageProposal = z.infer<typeof coverageProposalSchema>;
export type TAbsencePreviewBody = z.infer<typeof absencePreviewBodySchema>;
export type TAbsenceCreate = z.infer<typeof absenceCreateSchema>;
