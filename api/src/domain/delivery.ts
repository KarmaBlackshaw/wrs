import type { TPage } from "@wrs/contract/common";
import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TDelivery, TDeliveryCreate, TDeliveryLine, TDeliveryListQuery } from "@wrs/contract/trip";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { move, type TLocation } from "./container.ts";
import { assertCredit, depositDue, recordOwnership } from "./customer.ts";
import { recordDeposit } from "./deposit.ts";
import { priceAt } from "./product.ts";
import { deductUsage } from "./stock.ts";
import { deliveredByProduct, lockOpenTrip } from "./trip.ts";

type TDb = TCtx["db"];

type TDeliveryRow = Omit<TDelivery, "lines">;

type TDeliveryProduct = { id: string; name: string; containerType: TContainerTypeCode | null; deliverable: boolean | null };

const notOwner = () => domainError({ statusCode: 403, code: "trip.not_owner", message: "This trip belongs to another rider." });

export const deliveryQuery = (db: TDb) => {
  const deposits = db("depositEntries").select("refId", db.raw("sum(amount) as amount")).where({ kind: "collected", refType: "delivery" }).groupBy("refId");

  return db("deliveries as d")
    .join("customers as c", "c.id", "d.customerId")
    .join("trips as t", "t.id", "d.tripId")
    .join("employees as r", "r.id", "t.riderId")
    .leftJoin(deposits.as("e"), "e.refId", "d.id")
    .select(
      "d.id",
      "d.tripId",
      "d.customerId",
      db.raw(`${fullNameSql("c")} as customer_name`),
      db.raw(`${fullNameSql("r")} as rider_name`),
      "d.amount",
      "d.paymentType",
      db.raw("coalesce(e.amount, 0) as deposit_collected"),
      "d.voidedAt",
      "d.createdAt",
      "d.updatedAt"
    );
};

export const withLines = async (db: TDb, rows: TDeliveryRow[]): Promise<TDelivery[]> => {
  const lines: (TDeliveryLine & { deliveryId: string })[] = await db("deliveryLines as l")
    .join("products as p", "p.id", "l.productId")
    .whereIn(
      "l.deliveryId",
      rows.map(({ id }) => id)
    )
    .select("l.deliveryId", "l.productId", "p.name as productName", "l.qty", "l.unitPrice", "l.emptiesCollected")
    .orderBy("p.name");

  return rows.map((row) => ({ ...row, lines: lines.filter(({ deliveryId }) => deliveryId === row.id).map(({ deliveryId, ...line }) => line) }));
};

const getDelivery = async (db: TDb, id: string) => {
  const rows: TDeliveryRow[] = await deliveryQuery(db).where("d.id", id);
  const [delivery] = await withLines(db, rows);

  if (!delivery) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Delivery not found." });
  }

  return delivery;
};

const loadProducts = async (ctx: TCtx, lines: TDeliveryCreate["lines"]) => {
  const ids = lines.map(({ productId }) => productId);

  if (new Set(ids).size !== ids.length) {
    throw domainError({ statusCode: 422, code: "validation", message: "Each product can appear only once in a delivery.", details: { field: "lines" } });
  }

  const products: TDeliveryProduct[] = await ctx
    .db("products as p")
    .leftJoin("containerTypes as ct", "ct.code", "p.containerType")
    .whereIn("p.id", ids)
    .select("p.id", "p.name", "p.containerType", "ct.deliverable");

  return lines.map((line) => {
    const product = products.find(({ id }) => id === line.productId);

    if (!product) {
      throw domainError({
        statusCode: 422,
        code: "reference.not_found",
        message: "Product not found.",
        details: { field: "productId", productId: line.productId },
      });
    }

    const { containerType, deliverable } = product;

    if (containerType == null || !deliverable) {
      throw domainError({
        statusCode: 422,
        code: "product.not_deliverable",
        message: `${product.name} can't be delivered.`,
        details: { productId: product.id },
      });
    }

    return { ...line, productName: product.name, containerType };
  });
};

const remainingOnTrip = async (db: TDb, tripId: string) => {
  const rows: { productId: string; remaining: number }[] = await db("tripLines as tl")
    .leftJoin(deliveredByProduct(db, tripId).as("x"), "x.productId", "tl.productId")
    .where("tl.tripId", tripId)
    .select("tl.productId", db.raw("tl.loaded - coalesce(x.delivered, 0) as remaining"));

  return (productId: string) => rows.find((row) => row.productId === productId)?.remaining ?? 0;
};

export const recordDelivery = async (ctx: TCtx, input: TDeliveryCreate): Promise<TDelivery> => {
  const { id, tripId, customerId, paymentType, deposit } = input;
  const trip = await lockOpenTrip(ctx, tripId);
  const customer: { id: string; riderId: string | null } | undefined = await ctx.db("customers").where({ id: customerId }).forUpdate().first("id", "riderId");

  if (!customer) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Customer not found.", details: { field: "customerId" } });
  }

  const lines = await loadProducts(ctx, input.lines);

  const duplicate: { id: string } | undefined = await ctx.db("deliveries").where({ tripId, customerId }).whereNull("voidedAt").first("id");

  if (duplicate) {
    ctx.violation("delivery.duplicate", "This customer already has a delivery on this trip.", { deliveryId: duplicate.id });
  }

  const remaining = await remainingOnTrip(ctx.db, tripId);

  for (const { productId, productName, qty, unitPrice } of lines) {
    const left = remaining(productId);

    if (qty > left) {
      ctx.violation("trip.over_remaining", `Only ${left} ${productName} left on this trip.`, { productId, qty, remaining: left });
    }

    const price = await priceAt(ctx, { productId, at: ctx.now });

    if (price !== unitPrice) {
      ctx.violation("price.changed", `The price of ${productName} has changed.`, { productId, unitPrice, price: price ?? null });
    }
  }

  const amount = lines.reduce((sum, { qty, unitPrice }) => sum + qty * unitPrice, 0);

  if (paymentType === "credit") {
    await assertCredit(ctx, { customerId, amount });
  }

  const borrowed = lines.map(({ containerType, qty, emptiesCollected }) => ({ containerType, qty: qty - emptiesCollected }));
  const due = await depositDue(ctx, { customerId, borrowed });
  const collected = deposit?.lines.reduce((sum, line) => sum + line.amount, 0) ?? 0;

  if (borrowed.some(({ qty }) => qty > 0) && collected < due) {
    ctx.violation("deposit.required", "Collect the container deposit first.", { depositDue: due, collected });
  }

  const deliveryId = await insertRecord(ctx, "deliveries", { id, tripId, customerId, amount, paymentType });

  await ctx
    .db("deliveryLines")
    .insert(lines.map(({ productId, qty, unitPrice, emptiesCollected }) => ({ deliveryId, productId, qty, unitPrice, emptiesCollected })));

  const ref = { refType: "delivery", refId: deliveryId };
  const rider: TLocation = { kind: "rider", id: trip.riderId };
  const to: TLocation = { kind: "customer", id: customerId };

  for (const { productId, qty, emptiesCollected, containerType } of lines) {
    await move(ctx, { containerType, qty, isFull: true, from: rider, to, type: "to_customer", ...ref });

    if (emptiesCollected > 0) {
      await move(ctx, { containerType, qty: emptiesCollected, isFull: false, from: to, to: rider, type: "collected", ...ref });
    }

    await deductUsage(ctx, { productId, qty, ...ref });
  }

  if (deposit) {
    await recordDeposit(ctx, { customerId, kind: "collected", method: deposit.method, tripId, lines: deposit.lines, ...ref });
  }

  if (customer.riderId == null) {
    await ctx.db("customers").where({ id: customerId }).update({ riderId: trip.riderId });
    await recordOwnership(ctx, { customerId, event: "claimed_by_delivery", riderId: trip.riderId });
  }

  return getDelivery(ctx.db, deliveryId);
};

export const listDeliveries = async (ctx: TCtx, { page, pageSize, customerId, tripId }: TDeliveryListQuery): Promise<TPage<TDelivery>> => {
  const isRider = ctx.actor.activeRole === "rider";

  if (isRider && tripId) {
    const trip: { riderId: string } | undefined = await ctx.db("trips").where({ id: tripId }).first("riderId");

    if (trip && trip.riderId !== ctx.actor.id) {
      throw notOwner();
    }
  }

  const query = deliveryQuery(ctx.db).orderBy([
    { column: "d.createdAt", order: "desc" },
    { column: "d.id", order: "desc" },
  ]);

  if (isRider) {
    query.where("t.riderId", ctx.actor.id);
  }

  if (customerId) {
    query.where("d.customerId", customerId);
  }

  if (tripId) {
    query.where("d.tripId", tripId);
  }

  const result = await paginate<TDeliveryRow>(query, { page, pageSize });

  return { ...result, items: await withLines(ctx.db, result.items) };
};
