import type { TPage } from "@wrs/contract/common";
import type { TMeterReading, TMeterReadingBody, TMeterReadingListQuery } from "@wrs/contract/maintenance";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";

const latestRow = (ctx: TCtx) =>
  ctx.db("meterReadings").orderBy([
    { column: "at", order: "desc" },
    { column: "createdAt", order: "desc" },
  ]);

const meterReadingQuery = (ctx: TCtx) =>
  ctx
    .db("meterReadings as m")
    .join("employees as e", "e.id", "m.loggedBy")
    .select("m.id", "m.liters", "m.at", "m.loggedBy", ctx.db.raw(`${fullNameSql("e")} as logged_by_name`), "m.createdAt", "m.updatedAt");

export const latestMeterReading = async (ctx: TCtx): Promise<number | undefined> => {
  const latest: { liters: number } | undefined = await latestRow(ctx).first("liters");

  return latest?.liters;
};

export const listMeterReadings = (ctx: TCtx, { page, pageSize, date }: TMeterReadingListQuery): Promise<TPage<TMeterReading>> => {
  const query = meterReadingQuery(ctx).orderBy([
    { column: "m.at", order: "desc" },
    { column: "m.createdAt", order: "desc" },
  ]);

  if (date) {
    const { start, end } = manilaDayBounds(date);
    query.where("m.at", ">=", start).where("m.at", "<", end);
  }

  return paginate(query, { page, pageSize });
};

export const logMeterReading = async (ctx: TCtx, { liters }: TMeterReadingBody): Promise<TMeterReading> => {
  await latestRow(ctx).forUpdate().first("id");

  const last = await latestMeterReading(ctx);

  if (last != null && liters < last) {
    ctx.violation("meter.below_last", "Meter reading can't be lower than the last one.", { liters, last });
  }

  const readingId = await insertRecord(ctx, "meterReadings", { liters, at: ctx.now, loggedBy: ctx.actor.id });

  const reading: TMeterReading = await meterReadingQuery(ctx).where("m.id", readingId).first();

  return reading;
};
