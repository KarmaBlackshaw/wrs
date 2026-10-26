import type { TRole } from "@wrs/contract/auth";
import type { TPage } from "@wrs/contract/common";
import type {
  TAbsence,
  TEmployee,
  TEmployeeCreate,
  TEmployeeDetail,
  TEmployeeListQuery,
  TEmployeeOption,
  TEmployeeOptionsQuery,
  TEmployeeUpdate,
  TPayPlan,
  TPayPlanCreate,
  TPtoBalance,
} from "@wrs/contract/employee";
import argon2 from "argon2";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { requireValueAt } from "./setting.ts";

type TEmployeeRow = Omit<TEmployee, "roles">;

const DAY_MS = 24 * 60 * 60 * 1000;

const EMPLOYEE_COLUMNS = [
  "employees.id",
  "employees.username",
  "employees.firstName",
  "employees.lastName",
  "employees.phone",
  "employees.hireDate",
  "employees.active",
  "employees.createdAt",
  "employees.updatedAt",
];

const utcDay = (date: string) => new Date(`${date}T00:00:00Z`);

const addDays = (date: string, days: number) => new Date(utcDay(date).getTime() + days * DAY_MS).toISOString().slice(0, 10);

const fullName = (db: TCtx["db"], alias: string, as: string) => db.raw("concat(??, ' ', ??) as ??", [`${alias}.first_name`, `${alias}.last_name`, as]);

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Not found." });

const withRoles = async (db: TCtx["db"], rows: TEmployeeRow[]): Promise<TEmployee[]> => {
  const roleRows: { employeeId: string; role: TRole }[] = await db("employeeRoles")
    .whereIn(
      "employeeId",
      rows.map(({ id }) => id)
    )
    .select("employeeId", "role");

  return rows.map((row) => ({ ...row, roles: roleRows.filter(({ employeeId }) => employeeId === row.id).map(({ role }) => role) }));
};

const findEmployee = async (db: TCtx["db"], id: string): Promise<TEmployee> => {
  const row: TEmployeeRow | undefined = await db("employees").where({ id }).first(EMPLOYEE_COLUMNS);

  if (!row) {
    throw notFound();
  }

  const roles: TRole[] = await db("employeeRoles").where({ employeeId: id }).pluck("role");

  return { ...row, roles };
};

const lockEmployee = async (ctx: TCtx, id: string) => {
  const row = await ctx.db("employees").where({ id }).forUpdate().first("id");

  if (!row) {
    throw notFound();
  }
};

const payPlanQuery = (db: TCtx["db"]) =>
  db("payPlans")
    .join("employees", "employees.id", "payPlans.employeeId")
    .select(
      "payPlans.id",
      "payPlans.employeeId",
      fullName(db, "employees", "employee_name"),
      "payPlans.frequency",
      "payPlans.rateBasis",
      "payPlans.baseRate",
      "payPlans.quota",
      "payPlans.incentivePerContainer",
      "payPlans.deductionCapPct",
      "payPlans.restWeekday",
      "payPlans.ptoDaysOverride",
      "payPlans.maxLoanAmountOverride",
      "payPlans.effectiveFrom",
      "payPlans.effectiveTo",
      "payPlans.createdAt",
      "payPlans.updatedAt"
    );

export const listPayPlans = async (db: TCtx["db"], employeeId: string): Promise<TPayPlan[]> =>
  payPlanQuery(db).where("payPlans.employeeId", employeeId).orderBy("payPlans.effectiveFrom", "desc");

const planOn = (plans: TPayPlan[], date: string) =>
  plans.find(({ effectiveFrom, effectiveTo }) => effectiveFrom <= date && (effectiveTo == null || effectiveTo >= date));

export const workingDays = ({ from, to, plans }: { from: string; to: string; plans: TPayPlan[] }) => {
  let count = 0;

  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (planOn(plans, date)?.restWeekday !== utcDay(date).getUTCDay()) {
      count += 1;
    }
  }

  return count;
};

export const planInEffect = async (ctx: TCtx, { employeeId, at }: { employeeId: string; at: string }): Promise<TPayPlan | undefined> =>
  payPlanQuery(ctx.db)
    .where("payPlans.employeeId", employeeId)
    .andWhere("payPlans.effectiveFrom", "<=", at)
    .andWhere((query) => query.whereNull("payPlans.effectiveTo").orWhere("payPlans.effectiveTo", ">=", at))
    .orderBy("payPlans.effectiveFrom", "desc")
    .first();

export const ptoBalance = async (ctx: TCtx, { employeeId, year }: { employeeId: string; year: number }): Promise<TPtoBalance> => {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const today = manilaToday(ctx.now);
  const at = today < yearEnd ? today : yearEnd;
  const { hireDate } = await findEmployee(ctx.db, employeeId);
  const plans = await listPayPlans(ctx.db, employeeId);

  const fullAllowance =
    planOn(plans, at)?.ptoDaysOverride ?? (await requireValueAt(ctx, "pto.daysPerYear", today < yearEnd ? ctx.now : manilaDayBounds(yearEnd).start));
  const hireYear = Number(hireDate.slice(0, 4));
  const monthsRemaining = hireYear < year ? 12 : hireYear === year ? 13 - Number(hireDate.slice(5, 7)) : 0;
  const allowance = Math.floor((fullAllowance * monthsRemaining) / 12);

  const absences: { from: string; to: string }[] = await ctx
    .db("absences")
    .where({ employeeId })
    .andWhere("from", "<=", yearEnd)
    .andWhere("to", ">=", yearStart)
    .select("from", "to");

  const used = absences.reduce(
    (sum, { from, to }) => sum + workingDays({ from: from < yearStart ? yearStart : from, to: to > yearEnd ? yearEnd : to, plans }),
    0
  );

  return { year, allowance, used, remaining: Math.max(0, allowance - used) };
};

export const listEmployees = async (ctx: TCtx, { q, role, active = "all", page, pageSize }: TEmployeeListQuery): Promise<TPage<TEmployee>> => {
  const query = ctx
    .db("employees")
    .select(EMPLOYEE_COLUMNS)
    .orderBy([{ column: "employees.lastName" }, { column: "employees.firstName" }]);

  if (q) {
    const pattern = `%${q}%`;

    query.where((where) =>
      where
        .whereRaw("concat(first_name, ' ', last_name) like ?", [pattern])
        .orWhere("employees.username", "like", pattern)
        .orWhere("employees.phone", "like", pattern)
    );
  }

  if (role) {
    query.whereExists(ctx.db("employeeRoles").whereRaw("employee_roles.employee_id = employees.id").andWhere({ role }));
  }

  if (active !== "all") {
    query.where("employees.active", active === "active");
  }

  const result = await paginate<TEmployeeRow>(query, { page, pageSize });

  return { ...result, items: await withRoles(ctx.db, result.items) };
};

export const listEmployeeOptions = async (ctx: TCtx, { role, scope = "all" }: TEmployeeOptionsQuery): Promise<TEmployeeOption[]> => {
  const optionRole = scope === "available_for_trip" ? "rider" : role;

  const query = ctx
    .db("employees")
    .where("employees.active", true)
    .select("employees.id", fullName(ctx.db, "employees", "name"))
    .orderBy([{ column: "employees.lastName" }, { column: "employees.firstName" }]);

  if (optionRole) {
    query.whereExists(ctx.db("employeeRoles").whereRaw("employee_roles.employee_id = employees.id").andWhere({ role: optionRole }));
  }

  if (scope === "available_for_trip") {
    query.whereNotExists(ctx.db("trips").whereRaw("trips.rider_id = employees.id").whereIn("status", ["open", "returning"]));
  }

  return query;
};

export const getEmployeeDetail = async (ctx: TCtx, id: string): Promise<TEmployeeDetail> => {
  const employee = await findEmployee(ctx.db, id);
  const today = manilaToday(ctx.now);
  const planHistory = await listPayPlans(ctx.db, id);

  const absenceRows: Omit<TAbsence, "days">[] = await ctx
    .db("absences")
    .join("employees", "employees.id", "absences.employeeId")
    .join("employees as creators", "creators.id", "absences.createdBy")
    .where("absences.employeeId", id)
    .orderBy("absences.from", "desc")
    .select(
      "absences.id",
      "absences.employeeId",
      fullName(ctx.db, "employees", "employee_name"),
      "absences.from",
      "absences.to",
      fullName(ctx.db, "creators", "created_by_name"),
      "absences.createdAt"
    );

  return {
    ...employee,
    currentPlan: planOn(planHistory, today) ?? null,
    planHistory,
    pto: await ptoBalance(ctx, { employeeId: id, year: Number(today.slice(0, 4)) }),
    absences: absenceRows.map((absence) => ({ ...absence, days: workingDays({ from: absence.from, to: absence.to, plans: planHistory }) })),
  };
};

export const createEmployee = async (ctx: TCtx, { password, roles, phone, ...fields }: TEmployeeCreate): Promise<TEmployee> => {
  const passwordHash = await argon2.hash(password);
  const id = await insertRecord(ctx, "employees", { ...fields, phone: phone || null, passwordHash, active: true });

  await ctx.db("employeeRoles").insert(roles.map((role) => ({ employeeId: id, role })));

  return findEmployee(ctx.db, id);
};

export const updateEmployee = async (ctx: TCtx, { id, patch }: { id: string; patch: TEmployeeUpdate }): Promise<TEmployee> => {
  const { roles, phone, ...fields } = patch;

  const changes = Object.fromEntries(
    Object.entries({ ...fields, phone: phone === undefined ? undefined : phone || null }).filter(([, value]) => value !== undefined)
  );

  await ctx.db("employeeRoles").where({ role: "owner" }).forUpdate().select("employeeId");
  await lockEmployee(ctx, id);

  if (Object.keys(changes).length > 0) {
    await ctx.db("employees").where({ id }).update(changes);
  }

  if (roles) {
    await ctx.db("employeeRoles").where({ employeeId: id }).delete();
    await ctx.db("employeeRoles").insert(roles.map((role) => ({ employeeId: id, role })));
  }

  const activeOwners = await ctx
    .db("employeeRoles")
    .join("employees", "employees.id", "employeeRoles.employeeId")
    .where({ "employeeRoles.role": "owner", "employees.active": true })
    .count({ total: "*" })
    .first();

  if (Number(activeOwners?.total ?? 0) === 0) {
    throw domainError({ statusCode: 409, code: "employee.last_owner", message: "At least one active owner is required." });
  }

  return findEmployee(ctx.db, id);
};

export const setEmployeePassword = async (ctx: TCtx, { id, password }: { id: string; password: string }) => {
  await lockEmployee(ctx, id);

  await ctx
    .db("employees")
    .where({ id })
    .update({ passwordHash: await argon2.hash(password) });
};

export const createPayPlan = async (ctx: TCtx, { employeeId, plan }: { employeeId: string; plan: TPayPlanCreate }): Promise<TPayPlan> => {
  await lockEmployee(ctx, employeeId);

  const latest: Pick<TPayPlan, "id" | "effectiveFrom" | "effectiveTo"> | undefined = await ctx
    .db("payPlans")
    .where({ employeeId })
    .orderBy("effectiveFrom", "desc")
    .first("id", "effectiveFrom", "effectiveTo");

  if (latest && latest.effectiveFrom >= plan.effectiveFrom) {
    throw domainError({
      statusCode: 409,
      code: "conflict",
      message: "A pay plan already starts on or after this date.",
      details: { effectiveFrom: latest.effectiveFrom },
    });
  }

  if (latest && latest.effectiveTo == null) {
    await ctx
      .db("payPlans")
      .where({ id: latest.id })
      .update({ effectiveTo: addDays(plan.effectiveFrom, -1) });
  }

  const id = await insertRecord(ctx, "payPlans", {
    employeeId,
    frequency: plan.frequency,
    rateBasis: plan.rateBasis,
    baseRate: plan.baseRate,
    quota: plan.quota ?? null,
    incentivePerContainer: plan.incentivePerContainer ?? null,
    deductionCapPct: plan.deductionCapPct ?? null,
    restWeekday: plan.restWeekday ?? null,
    ptoDaysOverride: plan.ptoDaysOverride ?? null,
    maxLoanAmountOverride: plan.maxLoanAmountOverride ?? null,
    effectiveFrom: plan.effectiveFrom,
  });

  const created: TPayPlan | undefined = await payPlanQuery(ctx.db).where("payPlans.id", id).first();

  if (!created) {
    throw notFound();
  }

  return created;
};
