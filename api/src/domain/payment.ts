import type { TPage } from "@wrs/contract/common";
import type { TDepositEntry, TDepositListQuery } from "@wrs/contract/deposit";
import type { TPayment, TPaymentCreate, TPaymentListQuery } from "@wrs/contract/payment";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { getCustomer } from "./customer.ts";
import { requireOpen } from "./drawer.ts";
import { lockOpenTrip } from "./trip.ts";

const paymentQuery = (db: TCtx["db"]) =>
  db("payments as p")
    .join("customers as c", "c.id", "p.customerId")
    .join("employees as e", "e.id", "p.collectedBy")
    .select(
      "p.id",
      "p.customerId",
      db.raw(`${fullNameSql("c")} as customer_name`),
      "p.amount",
      "p.method",
      "p.source",
      "p.tripId",
      "p.drawerSessionId",
      "p.collectedBy",
      db.raw(`${fullNameSql("e")} as by_name`),
      "p.voidedAt",
      "p.createdAt",
      "p.updatedAt"
    );

export const recordPayment = async (ctx: TCtx, { id, customerId, amount, method, tripId }: TPaymentCreate): Promise<TPayment> => {
  const drawer = tripId ? undefined : await requireOpen(ctx);

  if (tripId) {
    await lockOpenTrip(ctx, tripId);
  }

  const customer = await ctx.db("customers").where({ id: customerId }).forUpdate().first("id");

  if (!customer) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Customer not found.", details: { field: "customerId" } });
  }

  const { creditBalance } = await getCustomer(ctx, customerId);

  if (amount > creditBalance) {
    ctx.violation("payment.over_balance", "Payment is more than the customer owes.", { customerId, amount, creditBalance });
  }

  const paymentId = await insertRecord(ctx, "payments", {
    id,
    customerId,
    amount,
    method,
    collectedBy: ctx.actor.id,
    source: tripId ? "trip" : "drawer",
    tripId: tripId ?? null,
    drawerSessionId: drawer?.id ?? null,
  });

  const payment: TPayment = await paymentQuery(ctx.db).where("p.id", paymentId).first();

  return payment;
};

export const listPayments = (ctx: TCtx, { page, pageSize, customerId }: TPaymentListQuery): Promise<TPage<TPayment>> => {
  const query = paymentQuery(ctx.db).orderBy([
    { column: "p.createdAt", order: "desc" },
    { column: "p.id", order: "desc" },
  ]);

  if (customerId) {
    query.where("p.customerId", customerId);
  }

  return paginate(query, { page, pageSize });
};

export const listDeposits = (ctx: TCtx, { page, pageSize, customerId }: TDepositListQuery): Promise<TPage<TDepositEntry>> => {
  const { db } = ctx;

  const query = db("depositEntries as d")
    .join("customers as c", "c.id", "d.customerId")
    .join("employees as e", "e.id", "d.createdBy")
    .select(
      "d.id",
      "d.customerId",
      db.raw(`${fullNameSql("c")} as customer_name`),
      "d.containerType",
      "d.qty",
      "d.amount",
      "d.kind",
      "d.method",
      "d.tripId",
      "d.drawerSessionId",
      "d.refType",
      "d.refId",
      "d.createdBy",
      db.raw(`${fullNameSql("e")} as by_name`),
      "d.createdAt",
      "d.updatedAt"
    )
    .orderBy([
      { column: "d.createdAt", order: "desc" },
      { column: "d.id", order: "desc" },
    ]);

  if (customerId) {
    query.where("d.customerId", customerId);
  }

  return paginate(query, { page, pageSize });
};
