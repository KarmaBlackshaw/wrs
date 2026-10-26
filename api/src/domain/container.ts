import { holdingSchema, type TContainerTypeCode, type TLocationKind, type TMovementType } from "@wrs/contract/container";
import { z } from "zod";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";

type TDb = TCtx["db"];

export type TLocation = { kind: TLocationKind; id: string | null };

type TMoveInput = {
  containerType: TContainerTypeCode;
  qty: number;
  isFull: boolean;
  from: TLocation;
  to: TLocation;
  type: TMovementType;
  refType: string;
  refId: string;
  reason?: string;
};

const stationHoldingsSchema = z.array(holdingSchema.pick({ containerType: true, full: true, empty: true }));

const idAt = (kind: TLocationKind, from: TLocation, to: TLocation) => (from.kind === kind ? from.id : to.kind === kind ? to.id : null);

export const move = (ctx: TCtx, { containerType, qty, isFull, from, to, type, refType, refId, reason }: TMoveInput) =>
  insertRecord(ctx, "containerMovements", {
    type,
    containerType,
    qty,
    full: isFull,
    fromLocation: from.kind,
    toLocation: to.kind,
    riderId: idAt("rider", from, to),
    customerId: idAt("customer", from, to),
    reason: reason ?? null,
    refType,
    refId,
    createdBy: ctx.actor.id,
  });

export const holdingsQuery = (db: TDb, { at }: { at?: Date } = {}) => {
  const side = (column: "to_location" | "from_location", sign: 1 | -1) => {
    const fullColumn = sign === -1 ? "case when type = 'filled' then false else `full` end as `full`" : "full";

    const query = db("containerMovements").select(
      db.raw(`${column} as location_kind`),
      db.raw(`case ${column} when 'rider' then rider_id when 'customer' then customer_id end as location_id`),
      "containerType",
      db.raw(fullColumn),
      db.raw(`${sign} * qty as qty`)
    );

    return at ? query.where("createdAt", "<=", at) : query;
  };

  return db
    .from(side("to_location", 1).unionAll(side("from_location", -1), true).as("m"))
    .select(
      "locationKind",
      "locationId",
      "containerType",
      db.raw("sum(case when `full` then qty else 0 end) as `full`"),
      db.raw("sum(case when `full` then 0 else qty end) as `empty`")
    )
    .groupBy("locationKind", "locationId", "containerType");
};

export const stationHoldings = async (ctx: TCtx, at?: Date) => {
  const station = holdingsQuery(ctx.db, { at }).having("locationKind", "=", "station");

  const rows = await ctx
    .db("containerTypes as t")
    .leftJoin(station.as("h"), "h.containerType", "t.code")
    .select("t.code as containerType", ctx.db.raw("coalesce(h.`full`, 0) as `full`"), ctx.db.raw("coalesce(h.`empty`, 0) as `empty`"))
    .orderBy("t.code");

  return stationHoldingsSchema.parse(rows);
};

export const lockContainerType = async (ctx: TCtx, code: TContainerTypeCode) => {
  const row = await ctx.db("containerTypes").where({ code }).forUpdate().first("code");

  if (!row) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: `Container type ${code} does not exist.`, details: { field: "containerType" } });
  }
};

type TDrawFullInput = {
  containerType: TContainerTypeCode;
  qty: number;
  to: TLocation;
  type: TMovementType;
  refType: string;
  refId: string;
};

export const drawFull = async (ctx: TCtx, { containerType, qty, to, type, refType, refId }: TDrawFullInput): Promise<void> => {
  await lockContainerType(ctx, containerType);

  const holdings = await stationHoldings(ctx);
  const { full = 0, empty = 0 } = holdings.find((holding) => holding.containerType === containerType) ?? {};

  if (qty > full + empty) {
    throw domainError({
      statusCode: 422,
      code: "container.station_short",
      message: `Station holds only ${full + empty} ${containerType} container(s).`,
      details: { containerType, available: full + empty },
    });
  }

  const station: TLocation = { kind: "station", id: null };

  if (qty > full) {
    await move(ctx, { containerType, qty: qty - full, isFull: true, from: station, to: station, type: "filled", refType, refId });
  }

  await move(ctx, { containerType, qty, isFull: true, from: station, to, type, refType, refId });
};
