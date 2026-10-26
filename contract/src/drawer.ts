import { z } from "zod";
import { dateRangeQuerySchema, idSchema, isoDateTimeSchema, moneySchema, pageQuerySchema } from "./common.ts";
import { expenseSchema } from "./expense.ts";
import { paymentMethodSchema } from "./payment.ts";

export const drawerSessionSchema = z.object({
  id: idSchema,
  cashierId: idSchema,
  cashierName: z.string(),
  openedAt: isoDateTimeSchema,
  openingCash: moneySchema,
  closedAt: isoDateTimeSchema.nullable(),
  countedCash: moneySchema.nullable(),
  expectedCash: moneySchema,
  variance: moneySchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const drawerBreakdownSchema = z.object({
  opening: moneySchema,
  cashWalkIns: moneySchema,
  cashDeposits: moneySchema,
  cashPayments: moneySchema,
  riderRemittances: moneySchema,
  drawerExpenses: moneySchema,
  depositRefunds: moneySchema,
  voidRefunds: moneySchema,
  expected: moneySchema,
});

export const drawerCurrentSchema = z.object({ session: drawerSessionSchema, breakdown: drawerBreakdownSchema, expenses: z.array(expenseSchema) }).nullable();

export const drawerOpenBodySchema = z.object({ openingCash: moneySchema.min(0) });

export const drawerCloseBodySchema = z.object({ countedCash: moneySchema.min(0) });

export const drawerSessionListQuerySchema = pageQuerySchema.extend({
  ...dateRangeQuerySchema.shape,
  cashierId: idSchema.optional(),
});

export const voidRefundSchema = z.object({
  id: idSchema,
  voidId: idSchema,
  amount: moneySchema,
  method: paymentMethodSchema,
  drawerSessionId: idSchema.nullable(),
  createdBy: idSchema,
  createdByName: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type TDrawerSession = z.infer<typeof drawerSessionSchema>;
export type TDrawerBreakdown = z.infer<typeof drawerBreakdownSchema>;
export type TDrawerCurrent = z.infer<typeof drawerCurrentSchema>;
export type TDrawerOpenBody = z.infer<typeof drawerOpenBodySchema>;
export type TDrawerCloseBody = z.infer<typeof drawerCloseBodySchema>;
export type TDrawerSessionListQuery = z.infer<typeof drawerSessionListQuerySchema>;
export type TVoidRefund = z.infer<typeof voidRefundSchema>;
