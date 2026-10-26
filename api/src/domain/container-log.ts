import { randomUUID } from "node:crypto";
import {
  containerCountSchema,
  containerMovementSchema,
  holdingSchema,
  type TContainerCount,
  type TContainerCountListQuery,
  type TContainerCountBody,
  type TContainerMovement,
  type THolding,
  type THoldingListQuery,
  type TMovementCreate,
  type TMovementListQuery,
} from "@wrs/contract/container";
import type { TPage } from "@wrs/contract/common";
import { z } from "zod";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { holdingsQuery, lockContainerType, move, stationHoldings } from "./container.ts";

const locationLabelSql = (kindColumn: string) =>
  `case ${kindColumn} when 'rider' then ${fullNameSql("r")} when 'customer' then ${fullNameSql("c")} when 'station' then 'Station' else 'External' end`;

const movementQuery = (ctx: TCtx) =>
  ctx
    .db("containerMovements as m")
    .leftJoin("employees as r", "r.id", "m.riderId")
    .leftJoin("customers as c", "c.id", "m.customerId")
    .join("employees as u", "u.id", "m.createdBy")
    .select(
      "m.id",
      "m.type",
      "m.containerType",
      "m.qty",
      "m.full",
      "m.fromLocation",
      "m.toLocation",
      ctx.db.raw(`${locationLabelSql("m.from_location")} as from_label`),
      ctx.db.raw(`${locationLabelSql("m.to_location")} as to_label`),
      "m.riderId",
      "m.customerId",
      "m.reason",
      "m.refType",
      "m.refId",
      "m.createdBy",
      ctx.db.raw(`${fullNameSql("u")} as created_by_name`),
      "m.createdAt",
      "m.updatedAt"
    );

const countQuery = (ctx: TCtx) =>
  ctx
    .db("containerCounts as k")
    .join("employees as u", "u.id", "k.createdBy")
    .select(
      "k.id",
      "k.date",
      "k.containerType",
      "k.full",
      "k.empty",
      "k.expectedFull",
      "k.expectedEmpty",
      ctx.db.raw("k.`full` - k.expected_full as variance_full"),
      ctx.db.raw("k.`empty` - k.expected_empty as variance_empty"),
      "k.createdBy",
      ctx.db.raw(`${fullNameSql("u")} as counted_by_name`),
      "k.createdAt",
      "k.updatedAt"
    );

export const listHoldings = async (ctx: TCtx, { locationKind, containerType, at, page, pageSize }: THoldingListQuery): Promise<TPage<THolding>> => {
  if (ctx.actor.activeRole === "cashier" && locationKind !== "station") {
    throw domainError({ statusCode: 403, code: "auth.role_forbidden", message: "Your role can only view station holdings." });
  }

  const asOf = at ? new Date(manilaDayBounds(at).end.getTime() - 1) : undefined;

  const query = ctx.db
    .from(holdingsQuery(ctx.db, { at: asOf }).as("h"))
    .leftJoin("employees as r", "r.id", "h.locationId")
    .leftJoin("customers as c", "c.id", "h.locationId")
    .whereRaw("(h.`full` <> 0 or h.`empty` <> 0)")
    .select("h.locationKind", "h.locationId", ctx.db.raw(`${locationLabelSql("h.location_kind")} as label`), "h.containerType", "h.full", "h.empty")
    .orderBy(["h.locationKind", "label", "h.containerType"]);

  if (locationKind) {
    query.where("h.locationKind", locationKind);
  } else {
    query.whereNot("h.locationKind", "external");
  }

  if (containerType) {
    query.where("h.containerType", containerType);
  }

  const result = await paginate<unknown>(query, { page, pageSize });

  return { ...result, items: z.array(holdingSchema).parse(result.items) };
};

export const listMovements = async (
  ctx: TCtx,
  { type, from, to, location, customerId, page, pageSize }: TMovementListQuery
): Promise<TPage<TContainerMovement>> => {
  const query = movementQuery(ctx).orderBy([
    { column: "m.createdAt", order: "desc" },
    { column: "m.id", order: "desc" },
  ]);

  if (type) {
    query.where("m.type", type);
  }

  if (from) {
    query.where("m.createdAt", ">=", manilaDayBounds(from).start);
  }

  if (to) {
    query.where("m.createdAt", "<", manilaDayBounds(to).end);
  }

  if (location) {
    query.where((builder) => builder.where("m.fromLocation", location).orWhere("m.toLocation", location));
  }

  if (customerId) {
    query.where("m.customerId", customerId);
  }

  const result = await paginate<unknown>(query, { page, pageSize });

  return { ...result, items: z.array(containerMovementSchema).parse(result.items) };
};

export const createMovement = async (ctx: TCtx, { type, containerType, qty, full: isFull, reason }: TMovementCreate): Promise<TContainerMovement> => {
  await lockContainerType(ctx, containerType);

  const isIntake = type === "purchased";

  if (!isIntake) {
    const holdings = await stationHoldings(ctx);
    const row = holdings.find((holding) => holding.containerType === containerType);
    const available = (isFull ? row?.full : row?.empty) ?? 0;

    if (qty > available) {
      throw domainError({
        statusCode: 422,
        code: "validation",
        message: `Station holds only ${available} ${isFull ? "full" : "empty"} ${containerType} container(s).`,
        details: { field: "qty", available },
      });
    }
  }

  const station = { kind: "station", id: null } as const;
  const external = { kind: "external", id: null } as const;

  const id = await move(ctx, {
    containerType,
    qty,
    isFull,
    from: isIntake ? external : station,
    to: isIntake ? station : external,
    type,
    refType: "manual",
    refId: randomUUID(),
    reason,
  });

  const created = await movementQuery(ctx).where("m.id", id).first();

  return containerMovementSchema.parse(created);
};

export const listCounts = async (ctx: TCtx, { from, to, page, pageSize }: TContainerCountListQuery): Promise<TPage<TContainerCount>> => {
  const query = countQuery(ctx).orderBy([
    { column: "k.date", order: "desc" },
    { column: "k.containerType", order: "asc" },
  ]);

  if (from) {
    query.where("k.date", ">=", from);
  }

  if (to) {
    query.where("k.date", "<=", to);
  }

  const result = await paginate<unknown>(query, { page, pageSize });

  return { ...result, items: z.array(containerCountSchema).parse(result.items) };
};

export const submitCounts = async (ctx: TCtx, { counts }: TContainerCountBody): Promise<TContainerCount[]> => {
  const types = counts.map(({ containerType }) => containerType);

  if (new Set(types).size !== types.length) {
    throw domainError({ statusCode: 422, code: "validation", message: "Each container type can appear only once.", details: { field: "counts" } });
  }

  for (const containerType of [...types].sort()) {
    await lockContainerType(ctx, containerType);
  }

  const date = manilaToday(ctx.now);
  const holdings = await stationHoldings(ctx);

  for (const { containerType, full, empty } of counts) {
    const expected = holdings.find((holding) => holding.containerType === containerType);

    const row = {
      full,
      empty,
      expectedFull: expected?.full ?? 0,
      expectedEmpty: expected?.empty ?? 0,
      createdBy: ctx.actor.id,
    };

    const existing = await ctx.db("containerCounts").where({ date, containerType }).forUpdate().first("id");

    if (existing) {
      await ctx.db("containerCounts").where({ id: existing.id }).update(row);
    } else {
      await insertRecord(ctx, "containerCounts", { date, containerType, ...row });
    }
  }

  const saved = await countQuery(ctx).where("k.date", date).whereIn("k.containerType", types).orderBy("k.containerType");

  return z.array(containerCountSchema).parse(saved);
};
