import type { TLabTest, TLabTestBody, TLabTestListQuery, TWaterReading, TWaterReadingBody, TWaterReadingListQuery } from "@wrs/contract/water";
import type { TPage } from "@wrs/contract/common";
import { settingValueSchemas } from "@wrs/contract/setting";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { valueAt } from "./setting.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

type TWaterReadingRow = Omit<TWaterReading, "isOutOfRange">;
type TLabTestRow = Omit<TLabTest, "dueStatus">;

const waterReadingQuery = (db: TCtx["db"]) =>
  db("waterReadings")
    .join("employees", "employees.id", "waterReadings.loggedBy")
    .select(
      "waterReadings.id",
      "waterReadings.tds",
      "waterReadings.ph",
      "waterReadings.at",
      "waterReadings.loggedBy",
      db.raw(`${fullNameSql("employees")} as logged_by_name`),
      "waterReadings.createdAt",
      "waterReadings.updatedAt"
    );

const rangeResolver = async (ctx: TCtx) => {
  const rows = await ctx.db("settings").where({ key: "water.tdsRangePpm" }).orderBy("effectiveFrom", "desc").select("value", "effectiveFrom");

  const history = rows.map(({ value, effectiveFrom }) => ({
    range: settingValueSchemas["water.tdsRangePpm"].parse(value),
    effectiveFrom: new Date(effectiveFrom),
  }));

  return (at: Date) => history.find((entry) => entry.effectiveFrom <= at)?.range;
};

const toReading = (row: TWaterReadingRow, resolve: Awaited<ReturnType<typeof rangeResolver>>): TWaterReading => {
  const range = resolve(new Date(row.at));

  return { ...row, isOutOfRange: range != null && (row.tds < range.min || row.tds > range.max) };
};

export const createWaterReading = async (ctx: TCtx, { tds, ph }: TWaterReadingBody): Promise<TWaterReading> => {
  const id = await insertRecord(ctx, "waterReadings", { tds, ph: ph ?? null, at: ctx.now, loggedBy: ctx.actor.id });
  const row: TWaterReadingRow = await waterReadingQuery(ctx.db).where("waterReadings.id", id).first();

  return toReading(row, await rangeResolver(ctx));
};

export const listWaterReadings = async (ctx: TCtx, { page, pageSize, from, to }: TWaterReadingListQuery): Promise<TPage<TWaterReading>> => {
  const query = waterReadingQuery(ctx.db).orderBy([
    { column: "waterReadings.at", order: "desc" },
    { column: "waterReadings.id", order: "desc" },
  ]);

  if (from) {
    query.where("waterReadings.at", ">=", manilaDayBounds(from).start);
  }

  if (to) {
    query.where("waterReadings.at", "<", manilaDayBounds(to).end);
  }

  const result = await paginate<TWaterReadingRow>(query, { page, pageSize });

  const resolve = await rangeResolver(ctx);

  return { ...result, items: result.items.map((row) => toReading(row, resolve)) };
};

const labTestQuery = (db: TCtx["db"]) =>
  db("labTests")
    .join("employees", "employees.id", "labTests.createdBy")
    .select(
      "labTests.id",
      "labTests.type",
      "labTests.date",
      "labTests.result",
      "labTests.fileId",
      "labTests.nextDue",
      "labTests.createdBy",
      db.raw(`${fullNameSql("employees")} as created_by_name`),
      "labTests.createdAt",
      "labTests.updatedAt"
    );

const dueStatusResolver = async (ctx: TCtx) => {
  const reminderDays = (await valueAt(ctx, "labTest.reminderDays", ctx.now)) ?? 0;
  const today = Date.parse(manilaToday(ctx.now));

  const rows: { id: string; type: string }[] = await ctx
    .db("labTests")
    .orderBy([
      { column: "date", order: "desc" },
      { column: "createdAt", order: "desc" },
      { column: "id", order: "desc" },
    ])
    .select("id", "type");
  const latestByType = new Map<string, string>();

  for (const { id, type } of [...rows].reverse()) {
    latestByType.set(type, id);
  }

  const latestIds = new Set(latestByType.values());

  return ({ id, nextDue }: Pick<TLabTest, "id" | "nextDue">): TLabTest["dueStatus"] => {
    if (!latestIds.has(id)) {
      return null;
    }

    const due = Date.parse(nextDue);

    return due < today ? "overdue" : due - reminderDays * DAY_MS <= today ? "due" : "not_due";
  };
};

export const createLabTest = async (ctx: TCtx, { type, date, result, fileId, nextDue }: TLabTestBody): Promise<TLabTest> => {
  const file = await ctx.db("files").where({ id: fileId }).first("id");

  if (!file) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Referenced record not found.", details: { field: "fileId" } });
  }

  const id = await insertRecord(ctx, "labTests", { type, date, result, fileId, nextDue, createdBy: ctx.actor.id });
  const row: TLabTestRow = await labTestQuery(ctx.db).where("labTests.id", id).first();

  return { ...row, dueStatus: (await dueStatusResolver(ctx))(row) };
};

export const listLabTests = async (ctx: TCtx, { page, pageSize }: TLabTestListQuery): Promise<TPage<TLabTest>> => {
  const query = labTestQuery(ctx.db).orderBy([
    { column: "labTests.date", order: "desc" },
    { column: "labTests.createdAt", order: "desc" },
    { column: "labTests.id", order: "desc" },
  ]);
  const result = await paginate<TLabTestRow>(query, { page, pageSize });

  const dueStatus = await dueStatusResolver(ctx);

  return { ...result, items: result.items.map((row) => ({ ...row, dueStatus: dueStatus(row) })) };
};
