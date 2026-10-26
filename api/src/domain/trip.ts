import type { TPage } from "@wrs/contract/common";
import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TDelivery, TLoadOutBody, TReceiveBody, TTrip, TTripDetail, TTripLine, TTripListQuery } from "@wrs/contract/trip";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { drawFull, move } from "./container.ts";
import { deliveryQuery, withLines } from "./delivery.ts";
import { requireOpen } from "./drawer.ts";

type TDb = TCtx["db"];

export type TTripRow = Omit<TTrip, "riderName" | "createdByName" | "receivedByName" | "reconciledByName" | "expectedCash" | "cashVariance">;

type TDeliveryRow = Omit<TDelivery, "lines">;

const STATION = { kind: "station", id: null } as const;

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Trip not found." });

const EXPECTED_CASH_SQL = `(
  (select coalesce(sum(amount), 0) from deliveries where trip_id = t.id and payment_type = 'cash' and voided_at is null)
  + (select coalesce(sum(amount), 0) from deposit_entries where trip_id = t.id and kind = 'collected' and method = 'cash')
  + (select coalesce(sum(amount), 0) from payments where trip_id = t.id and method = 'cash' and voided_at is null)
)`;

export const tripSummaryQuery = (db: TDb) => db("trips as t").select("t.id as tripId", db.raw(`${EXPECTED_CASH_SQL} as expected_cash`));

export const deliveredByProduct = (db: TDb, tripId: string) =>
  db("deliveryLines as l")
    .join("deliveries as d", "d.id", "l.deliveryId")
    .where("d.tripId", tripId)
    .whereNull("d.voidedAt")
    .select("l.productId", db.raw("sum(l.qty) as delivered"), db.raw("sum(l.empties_collected) as empties_collected"))
    .groupBy("l.productId");

const tripQuery = (db: TDb) =>
  db("trips as t")
    .join("employees as r", "r.id", "t.riderId")
    .join("employees as cb", "cb.id", "t.createdBy")
    .leftJoin("employees as rb", "rb.id", "t.receivedBy")
    .leftJoin("employees as rc", "rc.id", "t.reconciledBy")
    .select(
      "t.id",
      "t.riderId",
      db.raw(`${fullNameSql("r")} as rider_name`),
      "t.createdBy",
      db.raw(`${fullNameSql("cb")} as created_by_name`),
      "t.status",
      "t.loadedAt",
      "t.endedAt",
      "t.returnedAt",
      "t.receivedBy",
      db.raw(`${fullNameSql("rb")} as received_by_name`),
      "t.receivedDrawerSessionId",
      "t.reconciledBy",
      db.raw(`${fullNameSql("rc")} as reconciled_by_name`),
      "t.reconciledAt",
      db.raw(`${EXPECTED_CASH_SQL} as expected_cash`),
      "t.cashRemitted",
      db.raw(`t.cash_remitted - ${EXPECTED_CASH_SQL} as cash_variance`),
      "t.createdAt",
      "t.updatedAt"
    );

const tripLines = (ctx: TCtx, tripId: string): Promise<TTripLine[]> => {
  const { db, now } = ctx;

  const deliveredQty = "coalesce(x.delivered, 0)";
  const expectedFull = `greatest(0, tl.loaded - ${deliveredQty})`;
  const empties = "coalesce(x.empties_collected, 0)";

  return db("tripLines as tl")
    .join("products as p", "p.id", "tl.productId")
    .leftJoin(deliveredByProduct(db, tripId).as("x"), "x.productId", "tl.productId")
    .where("tl.tripId", tripId)
    .select(
      "tl.productId",
      "p.name as productName",
      db.raw(
        "coalesce((select pr.amount from prices pr where pr.product_id = tl.product_id and pr.effective_from <= ? order by pr.effective_from desc limit 1), 0) as unit_price",
        [now]
      ),
      "tl.loaded",
      db.raw(`${deliveredQty} as delivered`),
      db.raw(`tl.loaded - ${deliveredQty} as remaining`),
      db.raw(`${expectedFull} as expected_full`),
      "tl.returnedFull",
      db.raw(`${empties} as empties_collected`),
      "tl.returnedEmpty",
      db.raw(`tl.returned_full - ${expectedFull} as variance_full`),
      db.raw(`tl.returned_empty - ${empties} as variance_empty`)
    )
    .orderBy("p.name");
};

const tripDeliveries = async (db: TDb, tripId: string) => {
  const rows: TDeliveryRow[] = await deliveryQuery(db)
    .where("d.tripId", tripId)
    .orderBy([{ column: "d.createdAt" }, { column: "d.id" }]);

  return withLines(db, rows);
};

const lockTrip = async (db: TDb, id: string) => {
  const row: TTripRow | undefined = await db("trips").where({ id }).forUpdate().first();

  return row;
};

const lockKnownTrip = async (db: TDb, id: string) => {
  const trip = await lockTrip(db, id);

  if (!trip) {
    throw notFound();
  }

  return trip;
};

const assertOwnTrip = (ctx: TCtx, { riderId }: TTripRow) => {
  if (riderId !== ctx.actor.id) {
    throw domainError({ statusCode: 403, code: "trip.not_owner", message: "This trip belongs to another rider." });
  }
};

export const lockOpenTrip = async (ctx: TCtx, tripId: string): Promise<TTripRow> => {
  const trip = await lockTrip(ctx.db, tripId);

  if (!trip) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Trip not found.", details: { field: "tripId" } });
  }

  assertOwnTrip(ctx, trip);

  if (trip.status !== "open") {
    ctx.violation("trip.not_open", "This trip is no longer open.", { tripId, status: trip.status });
  }

  return trip;
};

export const getTripDetail = async (ctx: TCtx, id: string): Promise<TTripDetail> => {
  const trip: TTrip | undefined = await tripQuery(ctx.db).where("t.id", id).first();

  if (!trip) {
    throw notFound();
  }

  if (ctx.actor.activeRole === "rider" && trip.riderId !== ctx.actor.id) {
    throw domainError({ statusCode: 403, code: "trip.not_owner", message: "This trip belongs to another rider." });
  }

  return { ...trip, lines: await tripLines(ctx, id), deliveries: await tripDeliveries(ctx.db, id) };
};

export const listTrips = (ctx: TCtx, { page, pageSize, from, to, status, riderId }: TTripListQuery): Promise<TPage<TTrip>> => {
  const query = tripQuery(ctx.db).orderBy([
    { column: "t.loadedAt", order: "desc" },
    { column: "t.id", order: "desc" },
  ]);

  const ownRiderId = ctx.actor.activeRole === "rider" ? ctx.actor.id : riderId;

  if (ownRiderId) {
    query.where("t.riderId", ownRiderId);
  }

  if (status) {
    query.where("t.status", status);
  }

  if (from) {
    query.where("t.loadedAt", ">=", manilaDayBounds(from).start);
  }

  if (to) {
    query.where("t.loadedAt", "<", manilaDayBounds(to).end);
  }

  return paginate<TTrip>(query, { page, pageSize });
};

export const loadOutTrip = async (ctx: TCtx, { riderId, lines }: TLoadOutBody): Promise<TTripDetail> => {
  const productIds = lines.map(({ productId }) => productId);

  if (new Set(productIds).size !== productIds.length) {
    throw domainError({ statusCode: 422, code: "validation", message: "Each product can appear only once.", details: { field: "lines" } });
  }

  const rider = await ctx
    .db("employees")
    .where({ id: riderId, active: true })
    .whereExists(ctx.db("employeeRoles").whereRaw("employee_roles.employee_id = employees.id").andWhere({ role: "rider" }))
    .forUpdate()
    .first("id");

  if (!rider) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Rider not found.", details: { field: "riderId" } });
  }

  const existing: { id: string } | undefined = await ctx.db("trips").where({ riderId }).whereIn("status", ["open", "returning"]).first("id");

  if (existing) {
    ctx.violation("trip.open_exists", "This rider already has a trip in progress.", { tripId: existing.id });
  }

  const products: { id: string; name: string; containerType: TContainerTypeCode | null; deliverable: boolean | null }[] = await ctx
    .db("products as p")
    .leftJoin("containerTypes as ct", "ct.code", "p.containerType")
    .whereIn("p.id", productIds)
    .where("p.active", true)
    .select("p.id", "p.name", "p.containerType", "ct.deliverable");

  const draws = lines.map(({ productId, loaded }) => {
    const product = products.find(({ id }) => id === productId);

    if (!product) {
      throw domainError({ statusCode: 422, code: "reference.not_found", message: "Product not found.", details: { field: "lines", productId } });
    }

    const { containerType, deliverable } = product;

    if (containerType == null || !deliverable) {
      throw domainError({ statusCode: 422, code: "product.not_deliverable", message: `${product.name} can't go on a trip.`, details: { productId } });
    }

    return { containerType, qty: loaded };
  });

  const tripId = await insertRecord(ctx, "trips", { riderId, createdBy: ctx.actor.id, status: "open", loadedAt: ctx.now });

  await ctx.db("tripLines").insert(lines.map(({ productId, loaded }) => ({ tripId, productId, loaded })));

  for (const { containerType, qty } of draws.sort((a, b) => a.containerType.localeCompare(b.containerType))) {
    await drawFull(ctx, { containerType, qty, to: { kind: "rider", id: riderId }, type: "to_rider", refType: "trip", refId: tripId });
  }

  return getTripDetail(ctx, tripId);
};

export const endTrip = async (ctx: TCtx, { tripId }: { tripId: string }) => {
  const trip = await lockTrip(ctx.db, tripId);

  if (!trip) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Trip not found.", details: { field: "tripId" } });
  }

  assertOwnTrip(ctx, trip);

  if (trip.status === "open") {
    await ctx.db("trips").where({ id: tripId }).update({ status: "returning", endedAt: ctx.now });
  }
};

export const receiveTrip = async (ctx: TCtx, { tripId, lines, cashRemitted }: TReceiveBody & { tripId: string }): Promise<TTripDetail> => {
  const trip = await lockKnownTrip(ctx.db, tripId);

  if (trip.status !== "returning") {
    ctx.violation("trip.not_returning", "Only a trip the rider has ended can be received.", { status: trip.status });
  }

  const loaded: { productId: string; containerType: TContainerTypeCode | null }[] = await ctx
    .db("tripLines as tl")
    .join("products as p", "p.id", "tl.productId")
    .where("tl.tripId", tripId)
    .select("tl.productId", "p.containerType");

  const containerTypeOf = (productId: string) => loaded.find((line) => line.productId === productId);

  if (lines.some(({ productId }) => !containerTypeOf(productId))) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Product is not on this trip.", details: { field: "lines" } });
  }

  const receivedDrawerSessionId = cashRemitted > 0 ? (await requireOpen(ctx)).id : null;

  await ctx
    .db("trips")
    .where({ id: tripId })
    .update({ status: "returned", returnedAt: ctx.now, cashRemitted, receivedBy: ctx.actor.id, receivedDrawerSessionId });

  const from = { kind: "rider", id: trip.riderId } as const;

  await Promise.all(
    lines.flatMap(({ productId, returnedFull, returnedEmpty }) => {
      const containerType = containerTypeOf(productId)?.containerType;

      const returned = (qty: number, isFull: boolean) =>
        containerType && qty > 0 ? [move(ctx, { containerType, qty, isFull, from, to: STATION, type: "returned", refType: "trip", refId: tripId })] : [];

      return [
        ctx.db("tripLines").where({ tripId, productId }).update({ returnedFull, returnedEmpty }),
        ...returned(returnedFull, true),
        ...returned(returnedEmpty, false),
      ];
    })
  );

  return getTripDetail(ctx, tripId);
};

export const reconcileTrip = async (ctx: TCtx, tripId: string): Promise<TTripDetail> => {
  const trip = await lockKnownTrip(ctx.db, tripId);

  if (trip.status !== "returned") {
    ctx.violation("trip.not_returned", "Only a received trip can be reconciled.", { status: trip.status });
  }

  await ctx.db("trips").where({ id: tripId }).update({ status: "reconciled", reconciledBy: ctx.actor.id, reconciledAt: ctx.now });

  return getTripDetail(ctx, tripId);
};
