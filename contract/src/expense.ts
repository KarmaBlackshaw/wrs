import { z } from "zod";
import { idSchema, isoDateSchema, isoDateTimeSchema, moneySchema, pageOf, pageQuerySchema } from "./common.ts";

export const expenseSourceSchema = z.enum(["drawer", "owner"]);

export const expenseCategorySchema = z.object({
  id: idSchema,
  name: z.string(),
  active: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const expenseSchema = z.object({
  id: idSchema,
  categoryId: idSchema,
  categoryName: z.string(),
  amount: moneySchema,
  date: isoDateSchema,
  paidBy: idSchema,
  paidByName: z.string(),
  source: expenseSourceSchema,
  drawerSessionId: idSchema.nullable(),
  receiptFileId: idSchema.nullable(),
  note: z.string().nullable(),
  consumableId: idSchema.nullable(),
  qty: z.number().nullable(),
  refType: z.string().nullable(),
  refId: idSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
  deletedBy: idSchema.nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

const noteSchema = z.string().trim().min(1).max(255);

export const expenseCreateSchema = z.object({
  categoryId: idSchema,
  amount: moneySchema.min(1),
  note: noteSchema.optional(),
  consumableId: idSchema.optional(),
  qty: z.number().positive().optional(),
  receiptFileId: idSchema.optional(),
});

export const expenseUpdateSchema = expenseCreateSchema
  .partial()
  .extend({ note: noteSchema.nullable().optional(), receiptFileId: idSchema.nullable().optional() });

export const expenseListQuerySchema = pageQuerySchema.extend({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
  categoryId: idSchema.optional(),
});

export const expensePageSchema = pageOf(expenseSchema).extend({ totals: z.object({ amount: moneySchema }) });

export type TExpenseSource = z.infer<typeof expenseSourceSchema>;
export type TExpenseCategory = z.infer<typeof expenseCategorySchema>;
export type TExpense = z.infer<typeof expenseSchema>;
export type TExpenseCreate = z.infer<typeof expenseCreateSchema>;
export type TExpenseUpdate = z.infer<typeof expenseUpdateSchema>;
export type TExpenseListQuery = z.infer<typeof expenseListQuerySchema>;
export type TExpensePage = z.infer<typeof expensePageSchema>;
