import { z } from "zod";
import { dateRangeQuerySchema, isoDateSchema, moneySchema } from "./common.ts";

export const reportSlugSchema = z.enum([
  "rider-reconciliation",
  "shortages",
  "cashier-variance",
  "sales",
  "credit-aging",
  "containers-held",
  "container-count-variance",
  "stock-reorder",
  "maintenance-due",
  "water-quality",
  "expenses",
  "payroll-summary",
  "loan-balances",
  "monthly-profit",
]);

export const reportColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  align: z.enum(["left", "right"]),
  format: z.enum(["text", "money", "number", "date", "datetime"]),
});

export const reportTableSchema = z.object({
  columns: z.array(reportColumnSchema),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
});

export const reportSummarySchema = z.object({
  slug: reportSlugSchema,
  value: z.number().nullable(),
  count: z.number().int(),
  tone: z.enum(["default", "warn"]),
});

export const reportQuerySchema = dateRangeQuerySchema;

export const digestDaySchema = z.object({
  date: isoDateSchema,
  salesCash: moneySchema,
  salesCredit: moneySchema,
  collections: moneySchema,
  expenses: moneySchema,
  variances: moneySchema,
  lowStockCount: z.number().int(),
  maintenanceDueCount: z.number().int(),
  testsDueCount: z.number().int(),
});

export const alertKindSchema = z.enum([
  "low_stock",
  "maintenance_due",
  "tests_due",
  "open_shortages",
  "pending_approvals",
  "overdue_customers",
  "tds_out_of_range",
]);

export const dashboardSchema = z.object({
  today: digestDaySchema,
  alerts: z.array(z.object({ kind: alertKindSchema, count: z.number().int() })),
});

export type TReportSlug = z.infer<typeof reportSlugSchema>;
export type TReportColumn = z.infer<typeof reportColumnSchema>;
export type TReportTable = z.infer<typeof reportTableSchema>;
export type TReportSummary = z.infer<typeof reportSummarySchema>;
export type TReportQuery = z.infer<typeof reportQuerySchema>;
export type TDigestDay = z.infer<typeof digestDaySchema>;
export type TAlertKind = z.infer<typeof alertKindSchema>;
export type TDashboard = z.infer<typeof dashboardSchema>;
