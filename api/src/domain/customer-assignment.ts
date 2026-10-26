import type { TPage } from "@wrs/contract/common";
import type {
  TCustomer,
  TCustomerOwnership,
  TCustomerOwnershipListQuery,
  TCustomerReleaseBody,
  TDistributeCommit,
  TDistributePreviewBody,
  TDistributeProposal,
} from "@wrs/contract/customer";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { DomainError, domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { assertEligibleRiders, getCustomer, ownershipEventForRelease, recordOwnership } from "./customer.ts";

type TTargetField = "riderIds" | "assignments";

const riderNotFound = (field: TTargetField, riderId: string) =>
  domainError({ statusCode: 422, code: "reference.not_found", message: "The selected rider can't take customers.", details: { field, riderId } });

const sameRider = ({ field, riderId, riderName }: { field: TTargetField; riderId: string; riderName: string | null }) =>
  domainError({
    statusCode: 422,
    code: "reference.not_found",
    message: `${riderName ?? "This rider"} already has this customer.`,
    details: { field, riderId },
  });

const loadTargets = async (ctx: TCtx, { riderIds, field }: { riderIds: string[]; field: TTargetField }) => {
  if (riderIds.includes(ctx.actor.id)) {
    throw riderNotFound(field, ctx.actor.id);
  }

  try {
    return await assertEligibleRiders(ctx, riderIds);
  } catch (error) {
    const riderId = error instanceof DomainError ? error.body.details?.riderId : undefined;

    if (typeof riderId === "string") {
      throw riderNotFound(field, riderId);
    }

    throw error;
  }
};

const loadCustomers = async (
  ctx: TCtx,
  { customerIds, field, shouldLock }: { customerIds: string[]; field: "customerIds" | "assignments"; shouldLock: boolean }
) => {
  const query = ctx
    .db("customers as c")
    .leftJoin("employees as r", "r.id", "c.riderId")
    .whereIn("c.id", customerIds)
    .select("c.id", "c.riderId", ctx.db.raw(`${fullNameSql("c")} as name`), ctx.db.raw(`${fullNameSql("r")} as rider_name`));

  if (shouldLock) {
    query.forUpdate("c");
  }

  const customers: { id: string; riderId: string | null; name: string; riderName: string | null }[] = await query;
  const missing = customerIds.find((customerId) => !customers.some(({ id }) => id === customerId));

  if (missing) {
    throw domainError({
      statusCode: 422,
      code: "reference.not_found",
      message: "The selected customer does not exist.",
      details: { field, customerId: missing },
    });
  }

  return customerIds.flatMap((customerId) => customers.filter(({ id }) => id === customerId));
};

export const releaseCustomer = async (
  ctx: TCtx,
  { customerId, appliedAt }: TCustomerReleaseBody & { customerId: string; appliedAt?: Date }
): Promise<TCustomer> => {
  await ctx.db("customers").where({ id: customerId }).forUpdate().first("id");

  const customer = await getCustomer(ctx, customerId);

  if (customer.riderId == null) {
    return customer;
  }

  await ctx.db("customers").where({ id: customerId }).update({ riderId: null });
  await recordOwnership({ ...ctx, now: appliedAt ?? ctx.now }, { customerId, event: ownershipEventForRelease(ctx, customer), riderId: null });

  return getCustomer(ctx, customerId);
};

export const listCustomerOwnerships = async (
  ctx: TCtx,
  { customerId, query: { page, pageSize } }: { customerId: string; query: TCustomerOwnershipListQuery }
): Promise<TPage<TCustomerOwnership>> => {
  await getCustomer(ctx, customerId);

  const query = ctx
    .db("customerOwnerships as o")
    .leftJoin("employees as r", "r.id", "o.riderId")
    .join("employees as b", "b.id", "o.byEmployeeId")
    .where("o.customerId", customerId)
    .select(
      "o.id",
      "o.customerId",
      "o.event",
      "o.riderId",
      ctx.db.raw(`${fullNameSql("r")} as rider_name`),
      "o.byEmployeeId as byId",
      ctx.db.raw(`${fullNameSql("b")} as by_name`),
      "o.createdAt"
    )
    .orderBy([
      { column: "o.createdAt", order: "desc" },
      { column: "o.id", order: "desc" },
    ]);

  return paginate<TCustomerOwnership>(query, { page, pageSize });
};

export const previewDistribution = async (ctx: TCtx, { customerIds, riderIds }: TDistributePreviewBody): Promise<TDistributeProposal> => {
  const riders = await loadTargets(ctx, { riderIds, field: "riderIds" });
  const customers = await loadCustomers(ctx, { customerIds, field: "customerIds", shouldLock: false });

  const counts: { riderId: string; total: number }[] = await ctx
    .db("customers")
    .whereIn("riderId", riderIds)
    .groupBy("riderId")
    .select("riderId", ctx.db.raw("count(*) as total"));

  const loads = new Map(riderIds.map((riderId) => [riderId, Number(counts.find((count) => count.riderId === riderId)?.total ?? 0)]));

  return customers.map((customer) => {
    const eligible = riders.filter(({ id }) => id !== customer.riderId);

    if (customer.riderId != null && eligible.length === 0) {
      throw sameRider({ field: "riderIds", riderId: customer.riderId, riderName: customer.riderName });
    }

    const target = eligible.reduce((best, rider) => ((loads.get(rider.id) ?? 0) < (loads.get(best.id) ?? 0) ? rider : best));

    loads.set(target.id, (loads.get(target.id) ?? 0) + 1);

    return { customerId: customer.id, customerName: customer.name, fromRiderName: customer.riderName, toRiderId: target.id, toRiderName: target.name };
  });
};

export const commitDistribution = async (ctx: TCtx, { assignments }: TDistributeCommit) => {
  await loadTargets(ctx, { riderIds: assignments.map(({ riderId }) => riderId), field: "assignments" });

  const customers = await loadCustomers(ctx, { customerIds: assignments.map(({ customerId }) => customerId), field: "assignments", shouldLock: true });

  for (const [index, { customerId, riderId }] of assignments.entries()) {
    const customer = customers[index];

    if (customer?.riderId === riderId) {
      throw sameRider({ field: "assignments", riderId, riderName: customer.riderName });
    }

    await ctx.db("customers").where({ id: customerId }).update({ riderId });
    await recordOwnership(ctx, { customerId, event: customer?.riderId == null ? "assigned" : "reassigned", riderId });
  }
};
