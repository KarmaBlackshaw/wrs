import {
  settingEntrySchema,
  settingKeys,
  settingValueSchemas,
  type TSettingEntry,
  type TSettingKey,
  type TSettingValues,
  type TSettingWrite,
} from "@wrs/contract/setting";
import { z } from "zod";
import { domainError } from "../lib/errors/domainError.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDate } from "../lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";

const rowSchema = z.object({ key: z.string(), value: z.unknown(), effectiveFrom: z.coerce.date() });

const toEntry = (key: TSettingKey, rows: z.infer<typeof rowSchema>[], now: Date) => {
  const history = rows
    .filter((row) => row.key === key)
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())
    .map(({ value, effectiveFrom }) => ({ value: settingValueSchemas[key].parse(value), effectiveFrom: manilaDate(effectiveFrom), at: effectiveFrom }));
  const current = history.find(({ at }) => at <= now);

  return settingEntrySchema.parse({
    key,
    value: current?.value ?? null,
    effectiveFrom: current?.effectiveFrom ?? null,
    history: history.map(({ value, effectiveFrom }) => ({ value, effectiveFrom })),
  });
};

export const listSettings = async (ctx: TCtx): Promise<TSettingEntry[]> => {
  const rows = z.array(rowSchema).parse(await ctx.db("settings").select("key", "value", "effectiveFrom"));

  return settingKeys.map((key) => toEntry(key, rows, ctx.now));
};

export const writeSetting = async (ctx: TCtx, { key, value, effectiveFrom }: TSettingWrite): Promise<TSettingEntry> => {
  await ctx
    .db("settings")
    .insert({ key, value: JSON.stringify(value), effectiveFrom: manilaDayBounds(effectiveFrom).start })
    .onConflict(["key", "effectiveFrom"])
    .merge(["value"]);

  const rows = z.array(rowSchema).parse(await ctx.db("settings").where({ key }).select("key", "value", "effectiveFrom"));

  return toEntry(key, rows, ctx.now);
};

export async function valueAt<K extends TSettingKey>(ctx: TCtx, key: K, at: Date): Promise<TSettingValues[K] | undefined>;
export async function valueAt(ctx: TCtx, key: TSettingKey, at: Date) {
  const row = await ctx.db("settings").where({ key }).andWhere("effectiveFrom", "<=", at).orderBy("effectiveFrom", "desc").first("value");

  return row ? settingValueSchemas[key].parse(row.value) : undefined;
}

export const requireValueAt = async <K extends TSettingKey>(ctx: TCtx, key: K, at: Date): Promise<TSettingValues[K]> => {
  const value = await valueAt(ctx, key, at);

  if (value === undefined) {
    throw domainError({ statusCode: 422, code: "setting.not_set", message: `Setting ${key} is not set.`, details: { key } });
  }

  return value;
};
