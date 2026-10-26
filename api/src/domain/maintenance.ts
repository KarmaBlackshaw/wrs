import { isoDateTimeSchema } from "@wrs/contract/common";
import { maintenanceItemSchema, type TMaintenanceItem, type TMaintenanceLogBody, type TMaintenanceStatus } from "@wrs/contract/maintenance";
import { z } from "zod";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { manilaDate } from "../lib/dates/manilaDate.ts";
import { latestMeterReading } from "./meter-reading.ts";
import { addStockEntry } from "./stock.ts";

const DUE_RATIO = 0.8;
const DAY_MS = 86_400_000;

const itemRowSchema = z.object({ id: z.string(), name: z.string(), intervalLiters: z.number().nullable(), intervalDays: z.number().nullable() });
const logRowSchema = z.object({ consumableId: z.string(), at: isoDateTimeSchema, meterLiters: z.number() });

const statusOf = (ratio: number): TMaintenanceStatus => {
  if (ratio >= 1) {
    return "overdue";
  }

  return ratio >= DUE_RATIO ? "due" : "ok";
};

const loadItems = async (ctx: TCtx, consumableId?: string): Promise<TMaintenanceItem[]> => {
  const query = ctx
    .db("consumables")
    .where({ kind: "maintenance" })
    .select("id", "name", "intervalLiters", "intervalDays")
    .orderBy([{ column: "createdAt" }, { column: "id" }]);

  if (consumableId) {
    query.where({ id: consumableId });
  }

  const items = z.array(itemRowSchema).parse(await query);

  const logs = z.array(logRowSchema).parse(
    await ctx
      .db("maintenanceLogs")
      .whereIn(
        "consumableId",
        items.map(({ id }) => id)
      )
      .select("consumableId", "at", "meterLiters")
      .orderBy([
        { column: "at", order: "desc" },
        { column: "createdAt", order: "desc" },
      ])
  );

  const meterLiters = (await latestMeterReading(ctx)) ?? 0;
  const today = Date.parse(manilaDate(ctx.now));

  return items.map(({ id, name, intervalLiters, intervalDays }) => {
    const last = logs.find(({ consumableId: logId }) => logId === id);

    if (!last) {
      return { consumableId: id, name, intervalLiters, intervalDays, lastReplacedAt: null, litersSince: null, daysSince: null, status: "overdue" };
    }

    const litersSince = Math.max(0, meterLiters - last.meterLiters);
    const daysSince = Math.max(0, Math.round((today - Date.parse(manilaDate(new Date(last.at)))) / DAY_MS));
    const ratios = [intervalLiters ? litersSince / intervalLiters : 0, intervalDays ? daysSince / intervalDays : 0];

    return {
      consumableId: id,
      name,
      intervalLiters,
      intervalDays,
      lastReplacedAt: last.at,
      litersSince,
      daysSince,
      status: statusOf(Math.max(...ratios)),
    };
  });
};

export const listMaintenance = (ctx: TCtx) => loadItems(ctx);

export const logReplacement = async (ctx: TCtx, { consumableId, at, meterLiters }: TMaintenanceLogBody): Promise<TMaintenanceItem> => {
  const consumable = await ctx.db("consumables").where({ id: consumableId }).forUpdate().first("id", "kind");

  if (!consumable) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Consumable not found.", details: { field: "consumableId" } });
  }

  if (consumable.kind !== "maintenance") {
    throw domainError({ statusCode: 422, code: "validation", message: "Consumable is not a maintenance item.", details: { field: "consumableId" } });
  }

  const logId = await insertRecord(ctx, "maintenanceLogs", { consumableId, at: new Date(at), meterLiters, loggedBy: ctx.actor.id });
  await addStockEntry(ctx, { consumableId, kind: "maintenance", qty: -1, refType: "maintenance_log", refId: logId });

  const [item] = await loadItems(ctx, consumableId);

  return maintenanceItemSchema.parse(item);
};
