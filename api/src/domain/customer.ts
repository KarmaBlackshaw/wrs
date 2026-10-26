import type { TPage } from "@wrs/contract/common";
import type { TContainerTypeCode } from "@wrs/contract/container";
import type {
  TCustomer,
  TCustomerCreate,
  TCustomerCreditBody,
  TCustomerListQuery,
  TCustomerUpdate,
  TCustomerWaiverBody,
  TOwnershipEvent,
} from "@wrs/contract/customer";
import { creditBlock } from "@wrs/contract/rules/creditBlock";
import { depositDue as contractDepositDue } from "@wrs/contract/rules/depositDue";
import { dueStatus } from "@wrs/contract/rules/dueStatus";
import { isEarlyRelease } from "@wrs/contract/rules/isEarlyRelease";
import type { Knex } from "knex";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { listContainerTypes } from "./container-type.ts";

type TDb = TCtx["db"];

export type TCustomerRow = Omit<TCustomer, "heldByType" | "creditLimit" | "dueStatus" | "coverage"> & {
  heldByType: Partial<Record<TContainerTypeCode, number>>;
  oldestUnpaidOn: string | null;
  settingCreditLimit: number | null;
  today: string;
};

const SETTING_CREDIT_LIMIT_SQL =
  "(select s.value from settings s where s.key = 'customer.creditLimit' and s.effective_from <= ? order by s.effective_from desc limit 1) as setting_credit_limit";

const AGING_BUCKET_SQL = "case when b.credit_balance > 0 then elt(interval(datediff(?, b.oldest_unpaid_on), 7, 15, 30) + 1, 'current', '7', '15', '30+') end";

const manilaDay = (column: string) => `date(convert_tz(${column}, '+00:00', '+08:00'))`;

export const creditFifoQuery = (db: TDb, asOf?: Date) => {
  const until = (query: Knex.QueryBuilder) => (asOf ? query.where("createdAt", "<=", asOf) : query);

  const items = until(
    db("deliveries")
      .select("customerId", db.raw("'delivery' as ref_type"), "id as refId", "createdAt", "amount")
      .where({ paymentType: "credit" })
      .whereNull("voidedAt")
  ).unionAll(
    until(
      db("walkInSales")
        .select("customerId", db.raw("'walk_in_sale' as ref_type"), "id as refId", "createdAt", "amount")
        .where({ paymentType: "credit" })
        .whereNull("voidedAt")
        .whereNotNull("customerId")
    ),
    true
  );

  const paid = until(db("payments").select("customerId", db.raw("sum(amount) as paid")).whereNull("voidedAt").groupBy("customerId"));

  return db
    .from(items.as("i"))
    .leftJoin(paid.as("p"), "p.customerId", "i.customerId")
    .select(
      "i.customerId",
      "i.refType",
      "i.refId",
      "i.createdAt",
      "i.amount",
      db.raw("least(i.amount, greatest(0, sum(i.amount) over (partition by i.customer_id order by i.created_at, i.ref_id) - coalesce(p.paid, 0))) as unpaid")
    );
};

export const customerBalancesQuery = (db: TDb) => {
  const delivered = db("deliveries")
    .select("customerId", db.raw("sum(case when payment_type = 'credit' then amount else 0 end) as credit"), db.raw("max(created_at) as last_delivered_at"))
    .whereNull("voidedAt")
    .groupBy("customerId");

  const walkIns = db("walkInSales")
    .select("customerId", db.raw("sum(amount) as credit"))
    .where({ paymentType: "credit" })
    .whereNull("voidedAt")
    .whereNotNull("customerId")
    .groupBy("customerId");

  const paid = db("payments").select("customerId", db.raw("sum(amount) as paid")).whereNull("voidedAt").groupBy("customerId");

  const deposits = db("depositEntries")
    .select("customerId", db.raw("sum(case kind when 'collected' then amount when 'waived' then 0 else -amount end) as deposit"))
    .groupBy("customerId");

  const heldPerType = db("containerMovements")
    .select(
      "customerId",
      "containerType",
      db.raw("sum(case when to_location = 'customer' then qty when from_location = 'customer' then -qty else 0 end) as qty")
    )
    .whereNotNull("customerId")
    .groupBy("customerId", "containerType");

  const held = db
    .from(heldPerType.as("t"))
    .select("customerId", db.raw("json_objectagg(container_type, qty) as held_by_type"), db.raw("sum(qty) as total"))
    .groupBy("customerId");

  const unpaid = db
    .from(creditFifoQuery(db).as("f"))
    .select("customerId", db.raw(`min(${manilaDay("created_at")}) as oldest_unpaid_on`))
    .where("unpaid", ">", 0)
    .groupBy("customerId");

  return db("customers as c")
    .leftJoin(delivered.as("d"), "d.customerId", "c.id")
    .leftJoin(walkIns.as("w"), "w.customerId", "c.id")
    .leftJoin(paid.as("p"), "p.customerId", "c.id")
    .leftJoin(deposits.as("e"), "e.customerId", "c.id")
    .leftJoin(held.as("h"), "h.customerId", "c.id")
    .leftJoin(unpaid.as("u"), "u.customerId", "c.id")
    .select(
      "c.id as customerId",
      db.raw("coalesce(d.credit, 0) + coalesce(w.credit, 0) - coalesce(p.paid, 0) as credit_balance"),
      db.raw("coalesce(e.deposit, 0) as deposit_on_file"),
      db.raw("coalesce(h.held_by_type, json_object()) as held_by_type"),
      db.raw("coalesce(h.total, 0) as containers_held"),
      "d.lastDeliveredAt",
      db.raw(`date_add(${manilaDay("d.last_delivered_at")}, interval c.delivery_interval_days day) as next_due_on`),
      "u.oldestUnpaidOn"
    );
};

export const customerQuery = (ctx: TCtx) => {
  const { db, now } = ctx;
  const today = manilaToday(now);

  return db("customers as c")
    .join(customerBalancesQuery(db).as("b"), "b.customerId", "c.id")
    .leftJoin("employees as r", "r.id", "c.riderId")
    .select(
      "c.id",
      "c.firstName",
      "c.lastName",
      "c.phone",
      "c.address",
      "c.status",
      "c.riderId",
      db.raw(`${fullNameSql("r")} as rider_name`),
      "c.deliveryIntervalDays",
      "c.creditEnabled",
      "c.creditLimit as creditLimitOverride",
      "c.depositWaived",
      "b.heldByType",
      "b.containersHeld",
      "b.depositOnFile",
      "b.creditBalance",
      db.raw(`${AGING_BUCKET_SQL} as aging_bucket`, [today]),
      "b.lastDeliveredAt",
      "b.nextDueOn",
      "b.oldestUnpaidOn",
      db.raw(SETTING_CREDIT_LIMIT_SQL, [now]),
      db.raw("? as today", [today]),
      "c.createdAt",
      "c.updatedAt"
    );
};

export const toCustomer = ({ oldestUnpaidOn, settingCreditLimit, today, ...row }: TCustomerRow): TCustomer => ({
  ...row,
  heldByType: { round: 0, slim: 0, ...row.heldByType },
  creditLimit: row.creditLimitOverride ?? settingCreditLimit,
  dueStatus: dueStatus(row, today),
  coverage: null,
});

export const listCustomers = async (ctx: TCtx, { page, pageSize, q, scope, show, riderId, balance, aging }: TCustomerListQuery): Promise<TPage<TCustomer>> => {
  const today = manilaToday(ctx.now);

  const query = customerQuery(ctx).orderBy([
    { column: "c.createdAt", order: "desc" },
    { column: "c.id", order: "desc" },
  ]);

  if (scope === "mine") {
    query.where("c.riderId", ctx.actor.id);
  }

  if (show === "open") {
    query.whereNull("c.riderId");
  }

  if (show === "pending") {
    query.where("c.status", "pending");
  }

  if (show === "overdue") {
    query.where("b.nextDueOn", "<", today);
  }

  if (riderId) {
    query.where("c.riderId", riderId);
  }

  if (balance === "owing") {
    query.where("b.creditBalance", ">", 0);
  }

  if (aging) {
    query.whereRaw(`(${AGING_BUCKET_SQL}) = ?`, [today, aging]);
  }

  if (q) {
    const pattern = `%${q}%`;

    query.where((search) =>
      search
        .whereRaw(`${fullNameSql("c")} like ?`, [pattern])
        .orWhere("c.phone", "like", pattern)
        .orWhere("c.address", "like", pattern)
        .orWhereRaw(`${fullNameSql("r")} like ?`, [pattern])
    );
  }

  const result = await paginate<TCustomerRow>(query, { page, pageSize });

  return { ...result, items: result.items.map(toCustomer) };
};

export const getCustomer = async (ctx: TCtx, id: string): Promise<TCustomer> => {
  const row: TCustomerRow | undefined = await customerQuery(ctx).where("c.id", id).first();

  if (!row) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Customer not found." });
  }

  return toCustomer(row);
};

const lockCustomer = async (ctx: TCtx, id: string) => {
  const customer = await ctx.db("customers").where({ id }).forUpdate().first("id", "riderId");

  if (!customer) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Customer not found." });
  }

  return customer;
};

export const assertEligibleRiders = async (ctx: TCtx, riderIds: string[]) => {
  const riders: { id: string; name: string }[] = await ctx
    .db("employees as e")
    .join("employeeRoles as er", "er.employeeId", "e.id")
    .where({ "e.active": true, "er.role": "rider" })
    .whereIn("e.id", riderIds)
    .select("e.id", ctx.db.raw(`${fullNameSql("e")} as name`));

  const missing = riderIds.find((riderId) => !riders.some(({ id }) => id === riderId));

  if (missing) {
    throw domainError({
      statusCode: 422,
      code: "reference.not_found",
      message: "The selected rider can't take customers.",
      details: { field: "riderId", riderId: missing },
    });
  }

  return riders;
};

export const ownershipEventForRelease = (ctx: TCtx, customer: Pick<TCustomer, "nextDueOn">): TOwnershipEvent =>
  isEarlyRelease(customer, manilaToday(ctx.now)) ? "released_early" : "released";

const findByPhone = (ctx: TCtx, phone: string) => ctx.db("customers").where({ phone }).first("id");

const duplicatePhoneMessage = "A customer with this phone number already exists.";

export const recordOwnership = async (ctx: TCtx, { customerId, event, riderId }: { customerId: string; event: TOwnershipEvent; riderId: string | null }) => {
  await insertRecord(ctx, "customerOwnerships", { customerId, event, riderId, byEmployeeId: ctx.actor.id });
};

export const createCustomer = async (ctx: TCtx, input: TCustomerCreate): Promise<{ customer: TCustomer; aliasOf?: string }> => {
  const { id, firstName, lastName, phone, address, deliveryIntervalDays, allowDuplicateName } = input;
  const { activeRole } = ctx.actor;
  const existing = await findByPhone(ctx, phone);

  if (existing) {
    ctx.violation("customer.duplicate_phone", duplicatePhoneMessage, { customerId: existing.id });

    return { customer: await getCustomer(ctx, existing.id), aliasOf: id };
  }

  if (ctx.mode === "strict" && !allowDuplicateName) {
    const matches = await ctx.db("customers").where({ firstName, lastName }).select("id", "firstName", "lastName", "phone", "address");

    if (matches.length > 0) {
      throw domainError({
        statusCode: 409,
        code: "customer.duplicate_name",
        message: `A customer named ${firstName} ${lastName} already exists.`,
        details: { matches },
      });
    }
  }

  if (activeRole === "rider" && deliveryIntervalDays == null) {
    ctx.violation("customer.interval_required", "Set a delivery interval for this customer.");
  }

  const riderId = activeRole === "rider" ? ctx.actor.id : activeRole === "owner" ? (input.riderId ?? null) : null;

  if (riderId && activeRole === "owner") {
    await assertEligibleRiders(ctx, [riderId]);
  }

  const customerId = await insertRecord(ctx, "customers", {
    id,
    firstName,
    lastName,
    phone,
    address,
    riderId,
    deliveryIntervalDays: deliveryIntervalDays ?? null,
    status: activeRole === "owner" ? "active" : "pending",
  });

  await recordOwnership(ctx, { customerId, event: "created", riderId });

  return { customer: await getCustomer(ctx, customerId) };
};

const ownershipEvent = async (ctx: TCtx, { id, from, to }: { id: string; from: string | null; to: string | null }): Promise<TOwnershipEvent> => {
  if (to == null) {
    return ownershipEventForRelease(ctx, await getCustomer(ctx, id));
  }

  return from == null ? "assigned" : "reassigned";
};

export const updateCustomer = async (ctx: TCtx, id: string, { riderId, ...fields }: TCustomerUpdate): Promise<TCustomer> => {
  const customer = await lockCustomer(ctx, id);

  if (fields.phone) {
    const existing = await findByPhone(ctx, fields.phone);

    if (existing && existing.id !== id) {
      throw domainError({ statusCode: 409, code: "customer.duplicate_phone", message: duplicatePhoneMessage, details: { customerId: existing.id } });
    }
  }

  const isRiderChange = riderId !== undefined && riderId !== customer.riderId;

  if (isRiderChange && riderId) {
    await assertEligibleRiders(ctx, [riderId]);
  }

  const event = isRiderChange ? await ownershipEvent(ctx, { id, from: customer.riderId, to: riderId ?? null }) : undefined;
  const changes = isRiderChange ? { ...fields, riderId } : fields;

  if (Object.keys(changes).length > 0) {
    await ctx.db("customers").where({ id }).update(changes);
  }

  if (event) {
    await recordOwnership(ctx, { customerId: id, event, riderId: riderId ?? null });
  }

  return getCustomer(ctx, id);
};

export const approveCustomer = async (ctx: TCtx, id: string): Promise<TCustomer> => {
  await lockCustomer(ctx, id);
  await ctx.db("customers").where({ id }).update({ status: "active" });

  return getCustomer(ctx, id);
};

export const setCustomerCredit = async (ctx: TCtx, id: string, { enabled, limitOverride }: TCustomerCreditBody): Promise<TCustomer> => {
  await lockCustomer(ctx, id);
  await ctx.db("customers").where({ id }).update({ creditEnabled: enabled, creditLimit: limitOverride });

  return getCustomer(ctx, id);
};

export const setCustomerDepositWaiver = async (ctx: TCtx, id: string, { waived }: TCustomerWaiverBody): Promise<TCustomer> => {
  await lockCustomer(ctx, id);
  await ctx.db("customers").where({ id }).update({ depositWaived: waived });

  return getCustomer(ctx, id);
};

const creditMessages = {
  "credit.not_enabled": "Credit is not enabled for this customer.",
  "credit.over_limit": "This would put the customer over their credit limit.",
  "setting.not_set": "The default credit limit is not set.",
};

export const assertCredit = async (ctx: TCtx, { customerId, amount }: { customerId: string; amount: number }) => {
  await lockCustomer(ctx, customerId);

  const customer = await getCustomer(ctx, customerId);
  const code = creditBlock(customer, amount);

  if (code) {
    ctx.violation(code, creditMessages[code], { customerId, amount, creditBalance: customer.creditBalance, creditLimit: customer.creditLimit });
  }
};

export const depositDue = async (
  ctx: TCtx,
  { customerId, borrowed }: { customerId: string; borrowed: { containerType: TContainerTypeCode; qty: number }[] }
) => {
  await lockCustomer(ctx, customerId);

  const [customer, containerTypes] = await Promise.all([getCustomer(ctx, customerId), listContainerTypes(ctx)]);

  return contractDepositDue({ customer, containerTypes, borrowed });
};
