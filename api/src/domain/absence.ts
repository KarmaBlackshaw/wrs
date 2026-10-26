import { dueStatus } from "@wrs/contract/rules/dueStatus";
import type { TAbsence, TAbsenceCreate, TAbsencePreviewBody, TCoverageProposal } from "@wrs/contract/employee";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { customerQuery, type TCustomerRow } from "./customer.ts";
import { getEmployeeDetail, planInEffect } from "./employee.ts";

const notFound = (message: string, details: Record<string, unknown>) => domainError({ statusCode: 422, code: "reference.not_found", message, details });

const assertAbsence = async (ctx: TCtx, { employeeId, from, to, shouldLock }: TAbsencePreviewBody & { shouldLock: boolean }) => {
  if (from > to) {
    throw domainError({ statusCode: 422, code: "validation", message: "The absence must end on or after its first day.", details: { field: "to" } });
  }

  const query = ctx.db("employees").where({ id: employeeId }).first("id");
  const employee = await (shouldLock ? query.forUpdate() : query);

  if (!employee) {
    throw notFound("Employee not found.", { field: "employeeId" });
  }
};

const coveringRiders = async (ctx: TCtx, { employeeId, from, to }: TAbsencePreviewBody) => {
  const riders: { id: string; name: string }[] = await ctx
    .db("employees as e")
    .join("employeeRoles as er", "er.employeeId", "e.id")
    .where({ "e.active": true, "er.role": "rider" })
    .whereNot("e.id", employeeId)
    .whereNotExists(ctx.db("absences as a").whereRaw("a.employee_id = e.id").where("a.from", "<=", to).where("a.to", ">=", from))
    .orderBy([{ column: "e.lastName" }, { column: "e.firstName" }])
    .select("e.id", ctx.db.raw(`${fullNameSql("e")} as name`));

  const weekday = new Date(`${from}T00:00:00Z`).getUTCDay();
  const plans = await Promise.all(riders.map(({ id }) => planInEffect(ctx, { employeeId: id, at: from })));

  return riders.filter((_rider, index) => plans[index]?.restWeekday !== weekday);
};

export const previewAbsence = async (ctx: TCtx, body: TAbsencePreviewBody): Promise<TCoverageProposal> => {
  await assertAbsence(ctx, { ...body, shouldLock: false });

  const rows: TCustomerRow[] = await customerQuery(ctx).where("c.riderId", body.employeeId);
  const customers = rows.filter((row) => dueStatus(row, body.to) !== "not_due");
  const riders = await coveringRiders(ctx, body);

  if (customers.length > 0 && riders.length === 0) {
    throw domainError({ statusCode: 409, code: "conflict", message: "No other rider is working that day.", details: { customers: customers.length } });
  }

  const assignments = customers.flatMap(({ id, firstName, lastName }, index) => {
    const rider = riders[index % riders.length];

    return rider ? [{ customerId: id, customerName: `${firstName} ${lastName}`, coveringRiderId: rider.id, coveringRiderName: rider.name }] : [];
  });

  return { assignments, riders };
};

export const createAbsence = async (ctx: TCtx, { coverage, ...body }: TAbsenceCreate): Promise<TAbsence> => {
  const { employeeId, from, to } = body;

  await assertAbsence(ctx, { ...body, shouldLock: true });

  const overlap: { id: string; from: string; to: string } | undefined = await ctx
    .db("absences")
    .where({ employeeId })
    .where("from", "<=", to)
    .where("to", ">=", from)
    .first("id", "from", "to");

  if (overlap) {
    throw domainError({
      statusCode: 409,
      code: "conflict",
      message: "This employee is already absent on some of these days.",
      details: { absenceId: overlap.id, from: overlap.from, to: overlap.to },
    });
  }

  const customerIds = coverage.map(({ customerId }) => customerId);

  if (new Set(customerIds).size !== customerIds.length) {
    throw domainError({ statusCode: 422, code: "validation", message: "A customer can only be covered by one rider.", details: { field: "coverage" } });
  }

  const owned: string[] = customerIds.length > 0 ? await ctx.db("customers").where({ riderId: employeeId }).whereIn("id", customerIds).pluck("id") : [];
  const missingCustomer = customerIds.find((customerId) => !owned.includes(customerId));

  if (missingCustomer) {
    throw notFound("This customer isn't assigned to the absent rider.", { field: "coverage", customerId: missingCustomer });
  }

  const riders = coverage.length > 0 ? await coveringRiders(ctx, body) : [];
  const missingRider = coverage.find(({ coveringRiderId }) => !riders.some(({ id }) => id === coveringRiderId));

  if (missingRider) {
    throw notFound("The selected rider can't cover that day.", { field: "coverage", coveringRiderId: missingRider.coveringRiderId });
  }

  const absenceId = await insertRecord(ctx, "absences", { employeeId, from, to, createdBy: ctx.actor.id });

  if (coverage.length > 0) {
    await ctx.db("coverageAssignments").insert(coverage.map((assignment) => ({ ...assignment, absenceId })));
  }

  const { absences } = await getEmployeeDetail(ctx, employeeId);
  const absence = absences.find(({ id }) => id === absenceId);

  if (!absence) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Absence not found." });
  }

  return absence;
};
