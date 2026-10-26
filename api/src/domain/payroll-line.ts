import type { TPayPlan } from "@wrs/contract/employee";
import { payLineDeductionSchema, type TPayLine, type TPayLineAdjustment, type TPayLineDeduction, type TPayRun, type TPayslip } from "@wrs/contract/payroll";
import { z } from "zod";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { creditFifoQuery } from "./customer.ts";
import { listPayPlans, planInEffect, ptoBalance, workingDays } from "./employee.ts";
import { requireValueAt } from "./setting.ts";
import { deductibleShortages } from "./shortage.ts";

type TDb = TCtx["db"];
type TPeriod = Pick<TPayRun, "id" | "periodStart" | "periodEnd">;
type TStoredLineRow = Omit<TPayLine, "employeeName" | "adjustments" | "adjustmentsTotal" | "deductions" | "deductionsTotal" | "gross" | "creditPayback"> & {
  employeeName: string;
  adjustments: number;
  deductions: unknown;
};

const MANILA_LOADED_DAY = "date(convert_tz(t.loaded_at, '+00:00', '+08:00'))";

const deductionsSchema = z.array(payLineDeductionSchema.extend({ note: z.string().nullable().default(null) }));

const manilaDayMonth = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", day: "numeric", month: "short" });

const SHORTAGE_SOURCE_LABEL = { trip: "Trip", drawer: "Drawer" } as const;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const endOfDay = (date: string) => new Date(manilaDayBounds(date).end.getTime() - 1);

const clip = ({ from, to }: { from: string; to: string }, lo: string, hi: string) => ({ from: from < lo ? lo : from, to: to > hi ? hi : to });

const adjustmentQuery = (db: TDb) =>
  db("payLineAdjustments as a")
    .join("employees as e", "e.id", "a.employeeId")
    .join("employees as c", "c.id", "a.createdBy")
    .select(
      "a.id",
      "a.runId",
      "a.employeeId",
      db.raw(`${fullNameSql("e")} as employee_name`),
      "a.amount",
      "a.reason",
      "a.createdBy as createdById",
      db.raw(`${fullNameSql("c")} as created_by_name`),
      "a.createdAt",
      "a.updatedAt"
    )
    .orderBy([{ column: "a.createdAt" }, { column: "a.id" }]);

export const riderOutstanding = async (ctx: TCtx, { employeeId, asOf }: { employeeId: string; asOf: Date }): Promise<number> => {
  const row = await ctx.db
    .from(creditFifoQuery(ctx.db, asOf).as("f"))
    .join("deliveries as d", "d.id", "f.refId")
    .join("trips as t", "t.id", "d.tripId")
    .where("f.refType", "delivery")
    .where("t.riderId", employeeId)
    .sum({ total: "f.unpaid" })
    .first();

  return Number(row?.total ?? 0);
};

const riderTripDays = async (ctx: TCtx, { employeeId, periodStart, periodEnd }: { employeeId: string; periodStart: string; periodEnd: string }) => {
  const days: { day: string; delivered: number }[] = await ctx
    .db("trips as t")
    .where({ "t.riderId": employeeId, "t.status": "reconciled" })
    .where("t.loadedAt", ">=", manilaDayBounds(periodStart).start)
    .where("t.loadedAt", "<", manilaDayBounds(periodEnd).end)
    .groupByRaw(MANILA_LOADED_DAY)
    .select(
      ctx.db.raw(`${MANILA_LOADED_DAY} as day`),
      ctx.db.raw(`coalesce(sum((
        select coalesce(sum(l.qty), 0) from delivery_lines l
        join deliveries d on d.id = l.delivery_id
        join products p on p.id = l.product_id
        where d.trip_id = t.id and d.voided_at is null and p.container_type is not null
      )), 0) as delivered`)
    );

  return days;
};

const riderCredit = async (ctx: TCtx, { employeeId, run }: { employeeId: string; run: TPeriod }) => {
  const [outstanding, given, applied] = await Promise.all([
    riderOutstanding(ctx, { employeeId, asOf: endOfDay(run.periodEnd) }),
    ctx
      .db("deliveries as d")
      .join("trips as t", "t.id", "d.tripId")
      .where({ "t.riderId": employeeId, "d.paymentType": "credit" })
      .whereNull("d.voidedAt")
      .where("d.createdAt", ">=", manilaDayBounds(run.periodStart).start)
      .where("d.createdAt", "<=", endOfDay(run.periodEnd))
      .sum({ total: "d.amount" })
      .first(),
    ctx
      .db("payLines as l")
      .join("payRuns as r", "r.id", "l.runId")
      .where({ "l.employeeId": employeeId, "r.status": "finalized" })
      .whereNot("r.id", run.id)
      .first(ctx.db.raw("coalesce(sum(l.credit_held - l.credit_recovered), 0) as total")),
  ]);

  return { delta: outstanding - Number(applied?.total ?? 0), given: Number(given?.total ?? 0) };
};

const leaveDays = async (ctx: TCtx, { employeeId, run, plans }: { employeeId: string; run: TPeriod; plans: TPayPlan[] }) => {
  let paid = 0;
  let unpaid = 0;

  for (let year = Number(run.periodStart.slice(0, 4)); year <= Number(run.periodEnd.slice(0, 4)); year += 1) {
    const yearStart = `${year}-01-01`;
    const from = run.periodStart > yearStart ? run.periodStart : yearStart;
    const to = run.periodEnd < `${year}-12-31` ? run.periodEnd : `${year}-12-31`;

    const [{ allowance }, absences] = await Promise.all([
      ptoBalance(ctx, { employeeId, year }),
      ctx.db("absences").where({ employeeId }).where("from", "<=", to).where("to", ">=", yearStart).select("from", "to"),
    ]);

    const spans: { from: string; to: string }[] = absences;
    const throughPeriod = sum(spans.map((span) => workingDays({ ...clip(span, yearStart, to), plans })));
    const inPeriod = sum(spans.map((span) => workingDays({ ...clip(span, from, to), plans })));
    const covered = Math.min(inPeriod, Math.max(0, allowance - (throughPeriod - inPeriod)));

    paid += covered;
    unpaid += inPeriod - covered;
  }

  return { paid, unpaid };
};

const debtsDue = async (ctx: TCtx, { employeeId, run }: { employeeId: string; run: TPeriod }): Promise<TPayLineDeduction[]> => {
  const [previous, installments, shortages] = await Promise.all([
    ctx
      .db("payLines as l")
      .join("payRuns as r", "r.id", "l.runId")
      .where({ "l.employeeId": employeeId, "r.status": "finalized" })
      .where("r.periodEnd", "<", run.periodStart)
      .orderBy("r.periodEnd", "desc")
      .first("l.carriedOver"),
    ctx
      .db("installments as i")
      .join("loans as n", "n.id", "i.loanId")
      .where({ "n.employeeId": employeeId, "n.status": "released", "i.paid": false })
      .where("i.due", "<=", run.periodEnd)
      .orderBy([{ column: "i.due" }, { column: "i.loanId" }, { column: "i.seq" }])
      .select(
        "i.loanId",
        "n.type",
        "i.seq",
        "i.principalPart",
        "i.interestPart",
        ctx.db.raw("(select count(*) from installments x where x.loan_id = i.loan_id) as term")
      ),
    deductibleShortages(ctx, { employeeId, runId: run.id }),
  ]);

  const dues: { loanId: string; type: "advance" | "loan"; seq: number; principalPart: number; interestPart: number; term: number }[] = installments;
  const carriedOver = Number(previous?.carriedOver ?? 0);

  const installmentDebts = (type: "advance" | "loan") =>
    dues
      .filter((due) => due.type === type)
      .map(({ loanId, seq, term, principalPart, interestPart }) => ({
        kind: type,
        amount: principalPart + interestPart,
        refId: loanId,
        note: type === "advance" ? "Advance" : `Installment ${seq} of ${term}`,
      }));

  return [
    ...(carriedOver > 0 ? [{ kind: "carry_over" as const, amount: carriedOver, refId: null, note: "From previous run" }] : []),
    ...installmentDebts("advance"),
    ...installmentDebts("loan"),
    ...shortages.map(({ id, cash, source, createdAt }) => ({
      kind: "shortage" as const,
      amount: cash,
      refId: id,
      note: `${SHORTAGE_SOURCE_LABEL[source]} · ${manilaDayMonth.format(new Date(createdAt))}`,
    })),
  ];
};

export const computePayLine = async (
  ctx: TCtx,
  { run, employeeId, daysWorkedOverride }: { run: TPeriod; employeeId: string; daysWorkedOverride?: number | null }
): Promise<TPayLine> => {
  const plan = await planInEffect(ctx, { employeeId, at: run.periodEnd });

  if (!plan) {
    throw domainError({
      statusCode: 422,
      code: "reference.not_found",
      message: "The employee has no pay plan for this period.",
      details: { field: "employeeId" },
    });
  }

  const periodEndAt = endOfDay(run.periodEnd);

  const [plans, isRider, stored, adjustments, debts, capSetting] = await Promise.all([
    listPayPlans(ctx.db, employeeId),
    ctx.db("employeeRoles").where({ employeeId, role: "rider" }).first("employeeId"),
    ctx.db("payLines").where({ runId: run.id, employeeId }).first("daysWorkedOverride"),
    adjustmentQuery(ctx.db).where({ "a.runId": run.id, "a.employeeId": employeeId }),
    debtsDue(ctx, { employeeId, run }),
    requireValueAt(ctx, "pay.deductionCapPct", periodEndAt),
  ]);

  const leave = await leaveDays(ctx, { employeeId, run, plans });
  const tripDays = isRider ? await riderTripDays(ctx, { employeeId, periodStart: run.periodStart, periodEnd: run.periodEnd }) : [];
  const periodWorkingDays = workingDays({ from: run.periodStart, to: run.periodEnd, plans });
  const prefill = isRider ? tripDays.length : periodWorkingDays - leave.paid - leave.unpaid;
  const override = daysWorkedOverride === undefined ? (stored?.daysWorkedOverride ?? null) : daysWorkedOverride;
  const daysWorked = override ?? prefill;

  const quota = plan.quota ?? (await requireValueAt(ctx, "rider.dailyQuota", periodEndAt));
  const perContainer = plan.incentivePerContainer ?? (await requireValueAt(ctx, "rider.incentivePerContainer", periodEndAt));
  const incentive = sum(tripDays.map(({ delivered }) => Math.max(0, delivered - quota) * perContainer));
  const isPerDay = plan.rateBasis === "per_day";
  const base = isPerDay ? plan.baseRate * (daysWorked + leave.paid) : plan.baseRate;
  const dayRate = isPerDay || periodWorkingDays === 0 ? 0 : Math.round(plan.baseRate / periodWorkingDays);

  const lineAdjustments: TPayLineAdjustment[] = adjustments;
  const adjustmentsTotal = sum(lineAdjustments.map(({ amount }) => amount));
  const gross = base + incentive + adjustmentsTotal;
  const { delta, given } = isRider ? await riderCredit(ctx, { employeeId, run }) : { delta: 0, given: 0 };

  let room = Math.max(0, Math.floor((gross * (plan.deductionCapPct ?? capSetting)) / 100));

  const take = (debt: TPayLineDeduction): TPayLineDeduction => {
    const applied = Math.min(debt.amount, room);

    room -= applied;

    return { ...debt, amount: applied };
  };

  const carried = debts.map(take);
  const credit = delta > 0 ? take({ kind: "credit", amount: delta, refId: null, note: "Unpaid rider credit" }) : undefined;

  const unpaidLeaveDebt: TPayLineDeduction = {
    kind: "unpaid_leave",
    amount: leave.unpaid * dayRate,
    refId: null,
    note: `${leave.unpaid} ${leave.unpaid === 1 ? "day" : "days"} over PTO`,
  };
  const unpaidLeave = unpaidLeaveDebt.amount > 0 ? take(unpaidLeaveDebt) : undefined;
  const deductions = [...carried, ...(credit?.amount ? [credit] : []), ...(unpaidLeave ? [unpaidLeave] : [])];
  const deductionsTotal = sum(deductions.map(({ amount }) => amount));
  const owed = sum([...debts, unpaidLeaveDebt].map(({ amount }) => amount));
  const settled = deductionsTotal - (credit?.amount ?? 0);
  const creditApplied = credit ? credit.amount : delta;
  const creditRecovered = Math.max(0, given - delta);
  const creditPayback = Math.max(0, -delta);

  const employee = await ctx
    .db("employees")
    .where({ id: employeeId })
    .first(ctx.db.raw(`${fullNameSql("employees")} as name`));

  return {
    runId: run.id,
    employeeId,
    employeeName: String(employee?.name ?? ""),
    daysWorked,
    daysWorkedOverride: override,
    delivered: sum(tripDays.map(({ delivered }) => delivered)),
    base,
    incentive,
    adjustments: lineAdjustments,
    adjustmentsTotal,
    deductions,
    deductionsTotal,
    creditHeld: creditRecovered + creditApplied,
    creditRecovered,
    creditPayback,
    paidLeaveDays: leave.paid,
    unpaidLeaveDays: leave.unpaid,
    carriedOver: owed - settled,
    gross,
    net: gross - deductionsTotal + creditPayback,
  };
};

export const storedPayLines = async (ctx: TCtx, { runId, employeeId }: { runId: string; employeeId?: string }): Promise<TPayLine[]> => {
  const query = ctx
    .db("payLines as l")
    .join("employees as e", "e.id", "l.employeeId")
    .where("l.runId", runId)
    .orderBy([{ column: "e.lastName" }, { column: "e.firstName" }])
    .select(
      "l.runId",
      "l.employeeId",
      ctx.db.raw(`${fullNameSql("e")} as employee_name`),
      "l.daysWorked",
      "l.daysWorkedOverride",
      "l.delivered",
      "l.base",
      "l.incentive",
      "l.adjustments",
      "l.deductions",
      "l.creditHeld",
      "l.creditRecovered",
      "l.paidLeaveDays",
      "l.unpaidLeaveDays",
      "l.carriedOver",
      "l.net"
    );

  const adjustments = adjustmentQuery(ctx.db).where("a.runId", runId);

  if (employeeId) {
    query.where("l.employeeId", employeeId);
    adjustments.where("a.employeeId", employeeId);
  }

  const [rows, adjustmentRows]: [TStoredLineRow[], TPayLineAdjustment[]] = await Promise.all([query, adjustments]);

  return rows.map(({ adjustments: adjustmentsTotal, deductions: rawDeductions, ...row }) => {
    const deductions = deductionsSchema.parse(rawDeductions);
    const deductionsTotal = sum(deductions.map(({ amount }) => amount));
    const gross = row.base + row.incentive + adjustmentsTotal;

    return {
      ...row,
      adjustments: adjustmentRows.filter((adjustment) => adjustment.employeeId === row.employeeId),
      adjustmentsTotal,
      deductions,
      deductionsTotal,
      gross,
      creditPayback: Math.max(0, row.net - (gross - deductionsTotal)),
    };
  });
};

export const payslip = async (ctx: TCtx, { runId, employeeId }: { runId: string; employeeId: string }): Promise<TPayslip> => {
  const run: Pick<TPayRun, "frequency" | "periodStart" | "periodEnd" | "status" | "finalizedAt"> | undefined = await ctx
    .db("payRuns")
    .where({ id: runId })
    .first("frequency", "periodStart", "periodEnd", "status", "finalizedAt");

  if (!run) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Pay run not found." });
  }

  const { finalizedAt, status, ...period } = run;

  if (status !== "finalized" || finalizedAt == null) {
    throw domainError({ statusCode: 403, code: "payroll.run_not_finalized", message: "The payslip is available once the run is finalized." });
  }

  const [line] = await storedPayLines(ctx, { runId, employeeId });

  if (!line) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Payslip not found." });
  }

  return { ...line, ...period, finalizedAt };
};
