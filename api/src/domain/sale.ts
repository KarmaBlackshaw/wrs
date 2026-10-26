import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TDepositSubBody } from "@wrs/contract/deposit";
import { depositDue } from "@wrs/contract/rules/depositDue";
import {
  saleRowSchema,
  salesPageSchema,
  walkInSaleLineSchema,
  type TSaleRow,
  type TSalesListQuery,
  type TSalesPage,
  type TWalkInSale,
  type TWalkInSaleBody,
  type TWalkInSaleQuote,
  type TWalkInSaleQuoteBody,
} from "@wrs/contract/sale";
import { z } from "zod";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { makeCtx, type TCtx } from "../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { listContainerTypes } from "./container-type.ts";
import { drawFull, move, type TLocation } from "./container.ts";
import { assertCredit, getCustomer } from "./customer.ts";
import { recordDeposit } from "./deposit.ts";
import { requireOpen } from "./drawer.ts";
import { priceAt } from "./product.ts";
import { deductUsage } from "./stock.ts";

type TSaleProduct = { id: string; name: string; containerType: TContainerTypeCode | null };

type TPreparedLine = TWalkInSaleQuote["lines"][number] & { containerType: TContainerTypeCode | null };

const walkInLinesSchema = z.array(walkInSaleLineSchema);
const feedLinesSchema = z.array(saleRowSchema.shape.lines.element.extend({ saleId: z.string() }));

const invalid = (message: string, field: string) => domainError({ statusCode: 422, code: "validation", message, details: { field } });

const notFound = (message: string, details: Record<string, unknown>) => domainError({ statusCode: 422, code: "reference.not_found", message, details });

const prepareLines = async (ctx: TCtx, lines: TWalkInSaleBody["lines"]): Promise<TPreparedLine[]> => {
  const ids = lines.map(({ productId }) => productId);

  if (new Set(ids).size !== ids.length) {
    throw invalid("Each product can appear only once in a sale.", "lines");
  }

  const products: TSaleProduct[] = await ctx.db("products").whereIn("id", ids).where({ active: true }).select("id", "name", "containerType");

  return Promise.all(
    lines.map(async ({ productId, qty, borrowed, returned }) => {
      const product = products.find(({ id }) => id === productId);

      if (!product) {
        throw notFound("Product not found.", { field: "productId", productId });
      }

      if (product.containerType == null && borrowed + returned > 0) {
        throw invalid(`${product.name} has no container to lend or return.`, "lines");
      }

      if (borrowed > qty || returned < 0) {
        throw invalid(`Borrowed ${product.name} containers can't exceed the quantity sold.`, "lines");
      }

      const unitPrice = await priceAt(ctx, { productId, at: ctx.now });

      if (unitPrice == null) {
        throw notFound(`${product.name} has no price yet.`, { field: "productId", productId });
      }

      return { productId, productName: product.name, qty, unitPrice, borrowed, returned, lineTotal: qty * unitPrice, containerType: product.containerType };
    })
  );
};

const requireSaleCustomer = async (ctx: TCtx, { customerId, paymentType, deposit }: TWalkInSaleBody, lines: TPreparedLine[]) => {
  if (customerId) {
    const customer = await ctx.db("customers").where({ id: customerId }).forUpdate().first("id");

    if (!customer) {
      throw notFound("Customer not found.", { field: "customerId" });
    }

    return customerId;
  }

  if (paymentType === "credit" || deposit || lines.some(({ borrowed, returned }) => borrowed + returned > 0)) {
    throw invalid("Pick a customer for a credit sale, a deposit or containers.", "customerId");
  }

  return undefined;
};

const saleDepositLines = async (
  ctx: TCtx,
  { customerId, borrowed }: { customerId: string; borrowed: { containerType: TContainerTypeCode; qty: number }[] }
): Promise<TDepositSubBody["lines"]> => {
  const [customer, containerTypes] = await Promise.all([getCustomer(ctx, customerId), listContainerTypes(ctx)]);
  let onFile = customer.depositOnFile;

  return containerTypes.flatMap((containerType) => {
    const required = depositDue({ customer: { ...customer, depositOnFile: 0 }, containerTypes: [containerType], borrowed });
    const amount = Math.max(0, required - onFile);

    onFile = Math.max(0, onFile - required);

    return amount > 0 ? [{ containerType: containerType.code, qty: Math.ceil(amount / containerType.depositAmount), amount }] : [];
  });
};

const prepareSale = async (ctx: TCtx, { depositMethod, ...input }: TWalkInSaleQuoteBody) => {
  const lines = await prepareLines(ctx, input.lines);
  const customerId = await requireSaleCustomer(ctx, input, lines);
  const amount = lines.reduce((sum, { lineTotal }) => sum + lineTotal, 0);

  if (customerId && input.paymentType === "credit") {
    await assertCredit(ctx, { customerId, amount });
  }

  const borrowed = lines.flatMap(({ containerType, borrowed, returned }) => (containerType ? [{ containerType, qty: borrowed - returned }] : []));
  const depositLines = customerId ? await saleDepositLines(ctx, { customerId, borrowed }) : [];
  const due = depositLines.reduce((sum, { amount }) => sum + amount, 0);
  const deposit = depositMethod && depositLines.length > 0 ? { method: depositMethod, lines: depositLines } : input.deposit;
  const collected = deposit?.lines.reduce((sum, line) => sum + line.amount, 0) ?? 0;

  if (lines.some((line) => line.borrowed > 0) && collected < due) {
    ctx.violation("deposit.required", "Collect the container deposit first.", { depositDue: due, collected });
  }

  return { customerId, lines, amount, depositDue: due, depositLines };
};

export const quoteSale = async (ctx: TCtx, input: TWalkInSaleQuoteBody): Promise<TWalkInSaleQuote> => {
  const check = makeCtx({ db: ctx.db, actor: ctx.actor, now: ctx.now, mode: "record" });
  const { lines, amount, depositDue: due, depositLines } = await prepareSale(check, input);
  const [violation] = check.violations;

  return {
    lines: lines.map(({ containerType, ...line }) => line),
    amount,
    depositDue: due,
    depositLines,
    blockReason: violation ? { code: violation.code, message: violation.message } : null,
  };
};

export const getSale = async (ctx: TCtx, id: string): Promise<TWalkInSale> => {
  const { db } = ctx;

  const sale: Omit<TWalkInSale, "lines"> | undefined = await db("walkInSales as w")
    .join("drawerSessions as ds", "ds.id", "w.drawerSessionId")
    .join("employees as e", "e.id", "ds.cashierId")
    .leftJoin("customers as c", "c.id", "w.customerId")
    .where("w.id", id)
    .first(
      "w.id",
      "w.drawerSessionId",
      "w.customerId",
      db.raw(`${fullNameSql("c")} as customer_name`),
      db.raw(`${fullNameSql("e")} as by_name`),
      "w.amount",
      "w.paymentType",
      "w.voidedAt",
      "w.createdAt",
      "w.updatedAt"
    );

  if (!sale) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Sale not found." });
  }

  const lines = walkInLinesSchema.parse(
    await db("walkInSaleLines as l")
      .join("products as p", "p.id", "l.productId")
      .where("l.saleId", id)
      .select("l.productId", "p.name as productName", "l.qty", "l.unitPrice", "l.borrowed", "l.returned")
  );

  return { ...sale, lines };
};

export const recordSale = async (ctx: TCtx, input: TWalkInSaleBody): Promise<TWalkInSale> => {
  const drawer = await requireOpen(ctx);
  const { customerId, lines, amount } = await prepareSale(ctx, input);

  const saleId = await insertRecord(ctx, "walkInSales", { drawerSessionId: drawer.id, customerId: customerId ?? null, amount, paymentType: input.paymentType });

  await ctx
    .db("walkInSaleLines")
    .insert(lines.map(({ productId, qty, unitPrice, borrowed, returned }) => ({ saleId, productId, qty, unitPrice, borrowed, returned })));

  const ref = { refType: "walk_in_sale", refId: saleId };
  const station: TLocation = { kind: "station", id: null };
  const customer: TLocation = { kind: "customer", id: customerId ?? null };
  const byContainerType = lines.toSorted((a, b) => (a.containerType ?? "").localeCompare(b.containerType ?? ""));

  for (const { productId, qty, borrowed, returned, containerType } of byContainerType) {
    if (containerType && returned > 0) {
      await move(ctx, { containerType, qty: returned, isFull: false, from: customer, to: station, type: "returned", ...ref });
    }

    if (containerType && borrowed > 0) {
      await drawFull(ctx, { containerType, qty: borrowed, to: customer, type: "to_customer", ...ref });
    }

    await deductUsage(ctx, { productId, qty, ...ref });
  }

  if (customerId && input.deposit) {
    await recordDeposit(ctx, { customerId, kind: "collected", method: input.deposit.method, drawerSessionId: drawer.id, lines: input.deposit.lines, ...ref });
  }

  return getSale(ctx, saleId);
};

export const listSales = async (ctx: TCtx, { page, pageSize, from, to, paymentType, source }: TSalesListQuery): Promise<TSalesPage> => {
  const { db } = ctx;

  const walkIns = db("walkInSales as w")
    .join("drawerSessions as ds", "ds.id", "w.drawerSessionId")
    .join("employees as e", "e.id", "ds.cashierId")
    .leftJoin("customers as c", "c.id", "w.customerId")
    .select(
      "w.id",
      db.raw("'walk_in' as source"),
      db.raw("'walk_in_sale' as void_ref_type"),
      "w.createdAt",
      db.raw(`${fullNameSql("c")} as customer_name`),
      db.raw(`${fullNameSql("e")} as by_name`),
      "w.amount",
      "w.paymentType",
      "w.voidedAt"
    );

  const deliveries = db("deliveries as d")
    .join("trips as t", "t.id", "d.tripId")
    .join("employees as e", "e.id", "t.riderId")
    .join("customers as c", "c.id", "d.customerId")
    .select(
      "d.id",
      db.raw("'delivery' as source"),
      db.raw("'delivery' as void_ref_type"),
      "d.createdAt",
      db.raw(`${fullNameSql("c")} as customer_name`),
      db.raw(`${fullNameSql("e")} as by_name`),
      "d.amount",
      "d.paymentType",
      "d.voidedAt"
    );

  const base = db.from(walkIns.unionAll(deliveries, true).as("s"));

  if (from) {
    base.where("s.createdAt", ">=", manilaDayBounds(from).start);
  }

  if (to) {
    base.where("s.createdAt", "<", manilaDayBounds(to).end);
  }

  if (paymentType) {
    base.where("s.paymentType", paymentType);
  }

  if (source) {
    base.where("s.source", source);
  }

  const list = base
    .clone()
    .select(
      "s.id",
      "s.source",
      "s.createdAt",
      "s.customerName",
      "s.byName",
      "s.amount",
      "s.paymentType",
      db.raw(
        "case when s.voided_at is not null then 'voided' when exists (select 1 from voids v where v.ref_type = s.void_ref_type and v.ref_id = s.id and v.status = 'pending') then 'pending' else 'none' end as void_status"
      )
    )
    .orderBy([
      { column: "s.createdAt", order: "desc" },
      { column: "s.id", order: "desc" },
    ]);

  const [result, totals] = await Promise.all([
    paginate<Omit<TSaleRow, "lines">>(list, { page, pageSize }),
    base.clone().whereNull("s.voidedAt").first(db.raw("coalesce(sum(s.amount), 0) as amount"), db.raw("count(*) as count")),
  ]);

  const ids = result.items.map(({ id }) => id);

  const lines = feedLinesSchema.parse(
    await db("walkInSaleLines as l")
      .join("products as p", "p.id", "l.productId")
      .whereIn("l.saleId", ids)
      .select("l.saleId", "l.productId", "p.name as productName", "l.qty")
      .unionAll(
        db("deliveryLines as l")
          .join("products as p", "p.id", "l.productId")
          .whereIn("l.deliveryId", ids)
          .select("l.deliveryId as saleId", "l.productId", "p.name as productName", "l.qty"),
        true
      )
  );

  return {
    ...result,
    items: result.items.map((row) => ({ ...row, lines: lines.filter(({ saleId }) => saleId === row.id).map(({ saleId, ...line }) => line) })),
    totals: salesPageSchema.shape.totals.parse(totals),
  };
};
