import { z } from "zod";
import { isoDateSchema, moneySchema } from "./common.ts";
import { payFrequencySchema } from "./employee.ts";

export const loanMethodSchema = z.enum(["flat", "diminishing"]);

const amountSchema = moneySchema.min(0);

export const settingValueSchemas = {
  "rider.dailyQuota": z.number().int().min(0),
  "rider.incentivePerContainer": amountSchema,
  "pay.frequency": payFrequencySchema,
  "pay.baseRate": z.object({ rider: amountSchema, cashier: amountSchema, washer: amountSchema, helper: amountSchema }),
  "pay.deductionCapPct": z.number().min(0).max(100),
  "loan.interestRatePct": z.number().min(0),
  "loan.interestMethod": loanMethodSchema,
  "loan.maxAmount": amountSchema,
  "loan.maxTermMonths": z.number().int().min(1),
  "customer.creditLimit": amountSchema,
  "void.approvalThreshold": amountSchema,
  "water.tdsRangePpm": z
    .object({ min: z.number().min(0), max: z.number().min(0) })
    .refine(({ min, max }) => max >= min, { message: "Max must be at least min", path: ["max"] }),
  "labTest.reminderDays": z.number().int().min(0),
  "digest.sendTime": z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  "pto.daysPerYear": z.number().int().min(0),
};

type TSettingValueSchemas = typeof settingValueSchemas;

export type TSettingKey = keyof TSettingValueSchemas;
export type TSettingValues = { [K in TSettingKey]: z.infer<TSettingValueSchemas[K]> };

export const settingKeys = z.keyof(z.object(settingValueSchemas)).options;

function nonEmpty<T>([first, ...rest]: T[]): [T, ...T[]] {
  if (first === undefined) {
    throw new Error("settingValueSchemas is empty");
  }

  return [first, ...rest];
}

type TSettingEntryMember<K extends TSettingKey> = z.ZodObject<{
  key: z.ZodLiteral<K>;
  value: z.ZodNullable<TSettingValueSchemas[K]>;
  effectiveFrom: z.ZodNullable<typeof isoDateSchema>;
  history: z.ZodArray<z.ZodObject<{ value: TSettingValueSchemas[K]; effectiveFrom: typeof isoDateSchema }>>;
}>;

type TSettingWriteMember<K extends TSettingKey> = z.ZodObject<{
  key: z.ZodLiteral<K>;
  value: TSettingValueSchemas[K];
  effectiveFrom: typeof isoDateSchema;
}>;

const settingEntryMember = <K extends TSettingKey>(key: K): { [P in K]: TSettingEntryMember<P> }[K] =>
  z.object({
    key: z.literal(key),
    value: z.nullable(settingValueSchemas[key]),
    effectiveFrom: isoDateSchema.nullable(),
    history: z.array(z.object({ value: settingValueSchemas[key], effectiveFrom: isoDateSchema })),
  });

const settingWriteMember = <K extends TSettingKey>(key: K): { [P in K]: TSettingWriteMember<P> }[K] =>
  z.object({ key: z.literal(key), value: settingValueSchemas[key], effectiveFrom: isoDateSchema });

export const settingEntrySchema = z.discriminatedUnion("key", nonEmpty(settingKeys.map(settingEntryMember)));
export const settingWriteSchema = z.discriminatedUnion("key", nonEmpty(settingKeys.map(settingWriteMember)));

export type TLoanMethod = z.infer<typeof loanMethodSchema>;
export type TSettingEntry = z.infer<typeof settingEntrySchema>;
export type TSettingWrite = z.infer<typeof settingWriteSchema>;
