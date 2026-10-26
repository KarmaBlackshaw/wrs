import type {
  TPayAdjustmentBody,
  TPayLine,
  TPayLineDeductionKind,
  TPayRun,
  TPayRunCreate,
  TPayRunDetail,
  TShortageDismissBody,
  TShortageExcludeBody,
} from "@wrs/contract/payroll";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { computePayLine, storedPayLines } from "./payroll-line.ts";

type TRunRow = Omit<TPayRun, "grossTotal" | "deductionsTotal" | "netTotal">;
type TTotalsLine = Pick<TPayLine, "gross" | "deductionsTotal" | "net">;
type TStoredTotalsRow = Pick<TPayLine, "runId" | "base" | "incentive" | "deductions" | "net"> & { adjustments: number };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Pay run not found." });

const runQuery = (db: TCtx["db"]) =>
  db("payRuns as r")
    .leftJoin("employees as f", "f.id", "r.finalizedBy")
    .select(
      "r.id",
      "r.frequency",
      "r.periodStart",
      "r.periodEnd",
      "r.status",
      "r.finalizedBy as finalizedById",
      db.raw(`${fullNameSql("f")} as finalized_by_name`),
      "r.finalizedAt",
      "r.createdAt",
      "r.updatedAt"
    );

const withTotals = (run: TRunRow, lines: TTotalsLine[]): TPayRun => ({
  ...run,
  grossTotal: sum(lines.map(({ gross }) => gross)),
  deductionsTotal: sum(lines.map(({ deductionsTotal }) => deductionsTotal)),
  netTotal: sum(lines.map(({ net }) => net)),
});

const lockDraft = async (ctx: TCtx, id: string): Promise<TRunRow> => {
  await ctx.db("payRuns").where({ id }).forUpdate().first("id");

  const run: TRunRow | undefined = await runQuery(ctx.db).where("r.id", id).first();

  if (!run) {
    throw notFound();
  }

  if (run.status === "finalized") {
    throw domainError({ statusCode: 409, code: "payroll.finalized", message: "This pay run is finalized." });
  }

  return run;
};

const saveLine = async (ctx: TCtx, line: TPayLine) => {
  const { employeeName, adjustments, adjustmentsTotal, deductions, deductionsTotal, gross, creditPayback, ...row } = line;

  await ctx
    .db("payLines")
    .insert({ ...row, adjustments: adjustmentsTotal, deductions: JSON.stringify(deductions) })
    .onConflict(["runId", "employeeId"])
    .merge();
};

const recomputeLine = async (ctx: TCtx, { run, employeeId, daysWorkedOverride }: { run: TRunRow; employeeId: string; daysWorkedOverride?: number }) =>
  saveLine(ctx, await computePayLine(ctx, { run, employeeId, daysWorkedOverride }));

const eligibleEmployeeIds = async (ctx: TCtx, { frequency, periodEnd }: Pick<TPayRun, "frequency" | "periodEnd">) => {
  const rows: { employeeId: string }[] = await ctx
    .db("payPlans as p")
    .join("employees as e", "e.id", "p.employeeId")
    .where({ "e.active": true, "p.frequency": frequency })
    .where("p.effectiveFrom", "<=", periodEnd)
    .where((query) => query.whereNull("p.effectiveTo").orWhere("p.effectiveTo", ">=", periodEnd))
    .distinct("p.employeeId");

  return rows.map(({ employeeId }) => employeeId);
};

const requireLine = async (ctx: TCtx, { runId, employeeId }: { runId: string; employeeId: string }) => {
  const line = await ctx.db("payLines").where({ runId, employeeId }).first("employeeId");

  if (!line) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "The employee has no line in this pay run.", details: { field: "employeeId" } });
  }
};

export const getPayRun = async (ctx: TCtx, id: string): Promise<TPayRunDetail> => {
  const run: TRunRow | undefined = await runQuery(ctx.db).where("r.id", id).first();

  if (!run) {
    throw notFound();
  }

  const lines = await storedPayLines(ctx, { runId: id });

  return { ...withTotals(run, lines), lines };
};

export const listPayRuns = async (ctx: TCtx): Promise<TPayRun[]> => {
  const runs: TRunRow[] = await runQuery(ctx.db).orderBy([{ column: "r.periodStart", order: "desc" }, { column: "r.id" }]);

  const rows: TStoredTotalsRow[] = await ctx
    .db("payLines")
    .whereIn(
      "runId",
      runs.map(({ id }) => id)
    )
    .select("runId", "base", "incentive", "adjustments", "deductions", "net");

  return runs.map((run) =>
    withTotals(
      run,
      rows
        .filter(({ runId }) => runId === run.id)
        .map(({ base, incentive, adjustments, deductions, net }) => ({
          gross: base + incentive + adjustments,
          deductionsTotal: sum(deductions.map(({ amount }) => amount)),
          net,
        }))
    )
  );
};

export const createPayRun = async (ctx: TCtx, { frequency, periodStart, periodEnd }: TPayRunCreate): Promise<TPayRunDetail> => {
  if (periodStart > periodEnd) {
    throw domainError({ statusCode: 422, code: "validation", message: "The period must start on or before its end.", details: { field: "periodEnd" } });
  }

  // ponytail: every owner row is the global pay-run lock (no deadlock-prone gap locks); add a per-frequency lock row if run creation ever contends
  await ctx
    .db("employees")
    .whereIn("id", ctx.db("employeeRoles").where({ role: "owner" }).select("employeeId"))
    .orderBy("id")
    .forUpdate()
    .select("id");

  const overlap = await ctx
    .db("payRuns")
    .where({ frequency })
    .where("periodStart", "<=", periodEnd)
    .where("periodEnd", ">=", periodStart)
    .forUpdate()
    .first("id");

  if (overlap) {
    throw domainError({ statusCode: 409, code: "payroll.overlap", message: "This period overlaps another pay run.", details: { runId: overlap.id } });
  }

  const openDraft = await ctx.db("payRuns").where({ frequency, status: "draft" }).forUpdate().first("id");

  if (openDraft) {
    throw domainError({ statusCode: 409, code: "payroll.overlap", message: "Finalize the open draft run first.", details: { runId: openDraft.id } });
  }

  const id = await insertRecord(ctx, "payRuns", { frequency, periodStart, periodEnd, status: "draft" });
  const run = { id, periodStart, periodEnd };

  for (const employeeId of await eligibleEmployeeIds(ctx, { frequency, periodEnd })) {
    await saveLine(ctx, await computePayLine(ctx, { run, employeeId }));
  }

  return getPayRun(ctx, id);
};

export const updatePayLineDays = async (ctx: TCtx, { id, employeeId, daysWorked }: { id: string; employeeId: string; daysWorked: number }) => {
  const run = await lockDraft(ctx, id);

  await requireLine(ctx, { runId: id, employeeId });
  await recomputeLine(ctx, { run, employeeId, daysWorkedOverride: daysWorked });

  return getPayRun(ctx, id);
};

export const addPayAdjustment = async (ctx: TCtx, { id, employeeId, amount, reason }: TPayAdjustmentBody & { id: string }) => {
  const run = await lockDraft(ctx, id);

  await requireLine(ctx, { runId: id, employeeId });
  await insertRecord(ctx, "payLineAdjustments", { runId: id, employeeId, amount, reason, createdBy: ctx.actor.id });
  await recomputeLine(ctx, { run, employeeId });

  return getPayRun(ctx, id);
};

const recomputeLines = async (ctx: TCtx, run: TRunRow) => {
  const existing: { employeeId: string }[] = await ctx.db("payLines").where({ runId: run.id }).select("employeeId");
  const employeeIds = new Set([...existing.map(({ employeeId }) => employeeId), ...(await eligibleEmployeeIds(ctx, run))]);

  for (const employeeId of employeeIds) {
    await recomputeLine(ctx, { run, employeeId });
  }
};

export const recomputePayRun = async (ctx: TCtx, id: string) => {
  await recomputeLines(ctx, await lockDraft(ctx, id));

  return getPayRun(ctx, id);
};

const shortageInRun = async (ctx: TCtx, { run, shortageId }: { run: TRunRow; shortageId: string }) => {
  const lines = await storedPayLines(ctx, { runId: run.id });
  const line = lines.find(({ deductions }) => deductions.some(({ kind, refId }) => kind === "shortage" && refId === shortageId));
  const shortage: { deductedRunId: string | null } | undefined = await ctx.db("shortages").where({ id: shortageId }).forUpdate().first("deductedRunId");

  if (!line || !shortage) {
    throw domainError({ statusCode: 409, code: "shortage.not_in_run", message: "This shortage is not a deduction in this pay run." });
  }

  if (shortage.deductedRunId != null) {
    throw domainError({ statusCode: 409, code: "shortage.already_deducted", message: "This shortage was already deducted." });
  }

  return line.employeeId;
};

export const excludePayRunShortage = async (ctx: TCtx, { id, shortageId, reason }: TShortageExcludeBody & { id: string; shortageId: string }) => {
  const run = await lockDraft(ctx, id);
  const employeeId = await shortageInRun(ctx, { run, shortageId });

  await ctx.db("shortages").where({ id: shortageId }).update({ excludedRunId: id, exclusionReason: reason });
  await recomputeLine(ctx, { run, employeeId });

  return getPayRun(ctx, id);
};

export const dismissPayRunShortage = async (ctx: TCtx, { id, shortageId, reason }: TShortageDismissBody & { id: string; shortageId: string }) => {
  const run = await lockDraft(ctx, id);
  const employeeId = await shortageInRun(ctx, { run, shortageId });

  await ctx.db("shortages").where({ id: shortageId }).update({ dismissedAt: ctx.now, dismissReason: reason, dismissedBy: ctx.actor.id });
  await recomputeLine(ctx, { run, employeeId });

  return getPayRun(ctx, id);
};

export const finalizePayRun = async (ctx: TCtx, id: string) => {
  const run = await lockDraft(ctx, id);

  await recomputeLines(ctx, run);

  const deductions = (await storedPayLines(ctx, { runId: id })).flatMap((line) => line.deductions);

  const refIds = (kinds: TPayLineDeductionKind[]) => [
    ...new Set(deductions.flatMap(({ kind, refId }) => (kinds.includes(kind) && refId != null ? [refId] : []))),
  ];
  const shortageIds = refIds(["shortage"]);
  const loanIds = refIds(["advance", "loan"]);

  await ctx.db("shortages").whereIn("id", shortageIds).whereNull("deductedRunId").update({ deductedRunId: id });
  await ctx.db("installments").whereIn("loanId", loanIds).where({ paid: false }).where("due", "<=", run.periodEnd).update({ paid: true, payRunId: id });

  await ctx
    .db("loans")
    .whereIn("id", loanIds)
    .whereNotExists(ctx.db("installments").whereRaw("installments.loan_id = loans.id").where({ paid: false }))
    .update({ status: "paid" });

  await ctx.db("payRuns").where({ id }).update({ status: "finalized", finalizedBy: ctx.actor.id, finalizedAt: ctx.now });

  return getPayRun(ctx, id);
};
