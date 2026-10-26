import type { TWaiverRequest, TWaiverRequestRejectBody } from "@wrs/contract/customer";
import { domainError } from "../lib/errors/domainError.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { listContainerTypes } from "./container-type.ts";
import { getCustomer, setCustomerDepositWaiver } from "./customer.ts";
import { recordDeposit } from "./deposit.ts";

const waiverRequestQuery = (ctx: TCtx) =>
  ctx
    .db("approvalRequests as a")
    .join("customers as c", "c.id", "a.customerId")
    .join("employees as rb", "rb.id", "a.requestedBy")
    .leftJoin("employees as db", "db.id", "a.decidedBy")
    .where("a.kind", "waiver")
    .select(
      "a.id",
      "a.customerId",
      ctx.db.raw(`${fullNameSql("c")} as customer_name`),
      "a.requestedBy as requestedById",
      ctx.db.raw(`${fullNameSql("rb")} as requested_by_name`),
      "a.status",
      "a.decisionReason",
      ctx.db.raw(`${fullNameSql("db")} as decided_by_name`),
      "a.decidedAt",
      "a.createdAt"
    );

const getWaiverRequest = async (ctx: TCtx, id: string): Promise<TWaiverRequest> => {
  const row = await waiverRequestQuery(ctx).where("a.id", id).first();

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Waiver request not found." });
  }

  return row;
};

export const requestWaiver = async (ctx: TCtx, { id, customerId }: { id?: string; customerId: string }): Promise<TWaiverRequest> => {
  if (id) {
    const replayed = await ctx.db("approvalRequests").where({ id }).first("id");

    if (replayed) {
      return getWaiverRequest(ctx, id);
    }
  }

  const customer = await ctx.db("customers").where({ id: customerId }).forUpdate().first("id");

  if (!customer) {
    throw domainError({
      statusCode: 422,
      code: "reference.not_found",
      message: "The selected customer doesn't exist.",
      details: { field: "customerId", customerId },
    });
  }

  const pending = await ctx.db("approvalRequests").where({ kind: "waiver", customerId, status: "pending" }).first("id");

  if (pending) {
    return getWaiverRequest(ctx, pending.id);
  }

  const requestId = await insertRecord(ctx, "approvalRequests", { id, kind: "waiver", customerId, requestedBy: ctx.actor.id, status: "pending" });

  return getWaiverRequest(ctx, requestId);
};

const lockPending = async (ctx: TCtx, id: string) => {
  const request = await ctx.db("approvalRequests").where({ id, kind: "waiver" }).forUpdate().first("id", "customerId", "status");

  if (!request) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Waiver request not found." });
  }

  if (request.status !== "pending") {
    throw domainError({
      statusCode: 409,
      code: "approval.not_pending",
      message: "This request has already been decided.",
      details: { status: request.status },
    });
  }

  return request;
};

export const approveWaiver = async (ctx: TCtx, id: string): Promise<TWaiverRequest> => {
  const { customerId } = await lockPending(ctx, id);

  const [customer, containerTypes] = await Promise.all([getCustomer(ctx, customerId), listContainerTypes(ctx)]);

  await ctx.db("approvalRequests").where({ id }).update({ status: "approved", decidedBy: ctx.actor.id, decidedAt: ctx.now });
  await setCustomerDepositWaiver(ctx, customerId, { waived: true });

  await recordDeposit(ctx, {
    customerId,
    kind: "waived",
    refType: "waiver_request",
    refId: id,
    lines: containerTypes
      .filter(({ code }) => customer.heldByType[code] > 0)
      .map(({ code, depositAmount }) => ({
        containerType: code,
        qty: customer.heldByType[code],
        amount: customer.heldByType[code] * depositAmount,
      })),
  });

  return getWaiverRequest(ctx, id);
};

export const rejectWaiver = async (ctx: TCtx, id: string, { reason }: TWaiverRequestRejectBody): Promise<TWaiverRequest> => {
  await lockPending(ctx, id);
  await ctx.db("approvalRequests").where({ id }).update({ status: "rejected", decisionReason: reason, decidedBy: ctx.actor.id, decidedAt: ctx.now });

  return getWaiverRequest(ctx, id);
};
