import { randomUUID } from "node:crypto";
import type { TContainerReturnBody, TContainerReturnQuote, TContainerTypeCode } from "@wrs/contract/container";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { move, holdingsQuery } from "./container.ts";
import { listContainerTypes } from "./container-type.ts";
import { recordDeposit } from "./deposit.ts";
import { requireOpen } from "./drawer.ts";

const onFileSchema = z.array(z.object({ containerType: z.string(), amount: z.coerce.number() }));

const invalid = (message: string, field: string) => domainError({ statusCode: 422, code: "validation", message, details: { field } });

const prepareReturn = async (ctx: TCtx, { customerId, lines }: TContainerReturnBody) => {
  const types = lines.map(({ containerType }) => containerType);

  if (new Set(types).size !== types.length) {
    throw invalid("Each container type can appear only once.", "lines");
  }

  const customer: { id: string; depositWaived: boolean } | undefined = await ctx
    .db("customers")
    .where({ id: customerId })
    .forUpdate()
    .first("id", "depositWaived");

  if (!customer) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Customer not found.", details: { field: "customerId" } });
  }

  const [containerTypes, holdings, deposits] = await Promise.all([
    listContainerTypes(ctx),
    holdingsQuery(ctx.db).having("locationKind", "=", "customer").having("locationId", "=", customerId),
    ctx
      .db("depositEntries")
      .where({ customerId })
      .select("containerType", ctx.db.raw("sum(case kind when 'collected' then amount when 'waived' then 0 else -amount end) as amount"))
      .groupBy("containerType"),
  ]);

  const held = new Map(holdings.map(({ containerType, full, empty }) => [containerType, Number(full) + Number(empty)]));
  const onFile = new Map(onFileSchema.parse(deposits).map((row) => [row.containerType, row.amount]));
  const isWaived = customer.depositWaived;

  const priced = lines.map(({ containerType, qty }) => {
    const heldQty = held.get(containerType) ?? 0;

    if (qty > heldQty) {
      throw domainError({
        statusCode: 422,
        code: "validation",
        message: `Customer holds only ${heldQty} ${containerType} container(s).`,
        details: { field: "lines", containerType, held: heldQty },
      });
    }

    const unit = containerTypes.find(({ code }) => code === containerType)?.depositAmount ?? 0;
    const fileAmount = Math.max(onFile.get(containerType) ?? 0, 0);

    return { containerType, qty, refund: isWaived ? 0 : Math.min(qty * unit, fileAmount), fileAmount };
  });

  const quote: TContainerReturnQuote = {
    lines: priced.map(({ containerType, qty, refund }) => ({ containerType, qty, refund })),
    refund: priced.reduce((sum, { refund }) => sum + refund, 0),
    depositOnFile: priced.reduce((sum, { fileAmount }) => sum + fileAmount, 0),
    isWaived,
  };

  return quote;
};

export const quoteContainerReturn = (ctx: TCtx, input: TContainerReturnBody) => prepareReturn(ctx, input);

export const returnContainers = async (ctx: TCtx, input: TContainerReturnBody): Promise<TContainerReturnQuote> => {
  const drawer = await requireOpen(ctx);
  const quote = await prepareReturn(ctx, input);
  const { customerId } = input;
  const refId = randomUUID();
  const ref = { refType: "container_return", refId };

  for (const { containerType, qty } of quote.lines) {
    await move(ctx, {
      containerType,
      qty,
      isFull: false,
      from: { kind: "customer", id: customerId },
      to: { kind: "station", id: null },
      type: "returned",
      ...ref,
    });
  }

  const refunds: { containerType: TContainerTypeCode; qty: number; amount: number }[] = quote.lines
    .filter(({ refund }) => refund > 0)
    .map(({ containerType, qty, refund }) => ({ containerType, qty, amount: refund }));

  if (refunds.length > 0) {
    await recordDeposit(ctx, { customerId, kind: "refunded", method: "cash", drawerSessionId: drawer.id, lines: refunds, ...ref });
  }

  return quote;
};
