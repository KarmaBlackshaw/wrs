import type { TSyncSnapshot, TSyncSnapshotQuery } from "@wrs/contract/sync";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { listContainerTypes } from "./container-type.ts";
import { customerQuery, toCustomer, type TCustomerRow } from "./customer.ts";
import { listProducts } from "./product.ts";
import { getTripDetail } from "./trip.ts";

const CHILD_TABLES = ["deliveries", "walkInSales", "payments", "depositEntries", "containerMovements", "customerOwnerships"];

const changedCustomerIds = (ctx: TCtx, since: Date) => {
  const { db } = ctx;

  return db("customers")
    .select("id as customerId")
    .where("updatedAt", ">", since)
    .union(
      [
        ...CHILD_TABLES.map((table) => db(table).select("customerId").where("updatedAt", ">", since).whereNotNull("customerId")),
        db("coverageAssignments as ca").join("absences as a", "a.id", "ca.absenceId").select("ca.customerId").where("a.updatedAt", ">", since),
      ],
      true
    );
};

const listCustomersSince = async (ctx: TCtx, { since, until }: { since?: Date; until: Date }) => {
  const query = customerQuery(ctx).orderBy([
    { column: "c.createdAt", order: "desc" },
    { column: "c.id", order: "desc" },
  ]);

  if (since) {
    const isLimitChanged = await ctx
      .db("settings")
      .where({ key: "customer.creditLimit" })
      .where("effectiveFrom", ">", since)
      .where("effectiveFrom", "<=", until)
      .first("key");

    if (!isLimitChanged) {
      query.whereIn("c.id", changedCustomerIds(ctx, since));
    }
  }

  const rows: TCustomerRow[] = await query;

  return rows.map(toCustomer);
};

const currentTrip = async (ctx: TCtx) => {
  const trip = await ctx
    .db("trips")
    .where({ riderId: ctx.actor.id })
    .whereIn("status", ["open", "returning"])
    .orderBy([
      { column: "loadedAt", order: "desc" },
      { column: "id", order: "desc" },
    ])
    .first("id");

  return trip ? getTripDetail(ctx, trip.id) : null;
};

export const getSyncSnapshot = async (ctx: TCtx, { cursor }: TSyncSnapshotQuery): Promise<TSyncSnapshot> => {
  const { db } = ctx;
  const clock: { readAt: string; nextCursor: string } = await db.first(db.raw("now(3) as read_at"), db.raw("now(3) - interval 30 second as next_cursor"));

  const [trip, customers, products, containerTypes] = await Promise.all([
    currentTrip(ctx),
    listCustomersSince(ctx, { since: cursor ? new Date(cursor) : undefined, until: new Date(clock.readAt) }),
    listProducts(ctx, {}),
    listContainerTypes(ctx),
  ]);

  return { cursor: clock.nextCursor, trip, customers, products, containerTypes };
};
