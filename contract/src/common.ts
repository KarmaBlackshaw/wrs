import { z } from "zod";
import { MONEY_MAX, MONEY_MIN } from "./rules/moneyLimits.ts";

export const idSchema = z.uuid();
export const moneySchema = z.number().int().min(MONEY_MIN).max(MONEY_MAX);
export const isoDateSchema = z.iso.date();
export const isoDateTimeSchema = z.iso.datetime();

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(100).optional(),
});

export const dateRangeQuerySchema = z.object({ from: isoDateSchema.optional(), to: isoDateSchema.optional() });

export const pageOf = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() });

export type TPage<T> = { items: T[]; total: number; page: number; pageSize: number };

export const errorCodeSchema = z.enum([
  "validation",
  "unauthorized",
  "not_found",
  "internal",
  "auth.invalid_credentials",
  "auth.role_not_held",
  "auth.role_forbidden",
  "auth.inactive",
  "trip.not_owner",
  "drawer.not_owner",
  "payroll.run_not_finalized",
  "trip.open_exists",
  "trip.not_open",
  "trip.not_returning",
  "trip.not_returned",
  "delivery.duplicate",
  "drawer.open_exists",
  "drawer.not_open",
  "customer.duplicate_phone",
  "customer.duplicate_name",
  "customer.release_not_due",
  "payroll.overlap",
  "payroll.finalized",
  "employee.duplicate_username",
  "employee.last_owner",
  "expense_category.duplicate_name",
  "conflict",
  "shortage.not_in_run",
  "shortage.already_deducted",
  "void.already_voided",
  "approval.not_pending",
  "expense.session_closed",
  "credit.not_enabled",
  "credit.over_limit",
  "deposit.required",
  "trip.over_remaining",
  "product.not_deliverable",
  "payment.over_balance",
  "price.changed",
  "meter.below_last",
  "loan.over_max",
  "loan.authorization_required",
  "customer.interval_required",
  "setting.not_set",
  "file.type_not_allowed",
  "file.too_large",
  "reference.not_found",
]);

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: errorCodeSchema,
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type TErrorCode = z.infer<typeof errorCodeSchema>;
export type TApiError = z.infer<typeof apiErrorSchema>;
