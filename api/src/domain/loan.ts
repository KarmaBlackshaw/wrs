import type { TPage } from "@wrs/contract/common";
import type { TInstallment, TLoan, TLoanListQuery, TLoanMethod, TLoanReleaseBody, TLoanRequest } from "@wrs/contract/loan";
import type { TRejectBody } from "@wrs/contract/approval";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { insertRecord } from "../lib/context/insertRecord.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { paginate } from "../lib/page/paginate.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";
import { planInEffect } from "./employee.ts";
import { createExpense } from "./expense.ts";
import { requireValueAt } from "./setting.ts";

type TLoanRow = Omit<TLoan, "balance" | "nextInstallment" | "preview">;
type TScheduleInput = { principal: number; ratePct: number; method: TLoanMethod | null; termMonths: number | null };
type TSchedulePart = Pick<TInstallment, "seq" | "principalPart" | "interestPart">;

const LOAN_EXPENSE_CATEGORY = "Loans and advances";

export const loanQuery = (db: TCtx["db"]) =>
  db("loans")
    .join("employees as e", "e.id", "loans.employeeId")
    .leftJoin("employees as a", "a.id", "loans.approvedBy")
    .select(
      "loans.id",
      "loans.employeeId",
      db.raw(`${fullNameSql("e")} as employee_name`),
      "loans.type",
      "loans.principal",
      "loans.ratePct",
      "loans.method",
      "loans.termMonths",
      "loans.status",
      "loans.authorizationFileId",
      "loans.approvedBy as approvedById",
      db.raw(`${fullNameSql("a")} as approved_by_name`),
      "loans.releasedAt",
      "loans.decidedAt",
      "loans.decisionReason",
      "loans.createdAt",
      "loans.updatedAt"
    );

const installmentColumns = ["loanId", "seq", "due", "principalPart", "interestPart", "paid", "payRunId"];

export const schedule = ({ principal, ratePct, method, termMonths }: TScheduleInput): TSchedulePart[] => {
  if (method == null || termMonths == null) {
    return [{ seq: 1, principalPart: principal, interestPart: 0 }];
  }

  const part = Math.floor(principal / termMonths);

  return Array.from({ length: termMonths }, (_, index) => {
    const remaining = principal - part * index;
    const principalPart = index === termMonths - 1 ? remaining : part;
    const interestBase = method === "flat" ? principal : remaining;

    return { seq: index + 1, principalPart, interestPart: Math.round((interestBase * ratePct) / 100) };
  });
};

export const loanBalance = ({ principal, installments }: { principal: number; installments: Pick<TInstallment, "principalPart" | "paid">[] }) =>
  principal - installments.reduce((sum, { principalPart, paid }) => sum + (paid ? principalPart : 0), 0);

const preview = (input: TScheduleInput): TLoan["preview"] => {
  const parts = schedule(input);
  const totalInterest = parts.reduce((sum, { interestPart }) => sum + interestPart, 0);

  return { totalInterest, installment: Math.round((input.principal + totalInterest) / parts.length) };
};

const addMonths = (date: string, months: number) => {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();

  target.setUTCDate(Math.min(day, lastDay));

  return target.toISOString().slice(0, 10);
};

const datedSchedule = ({ loan, start }: { loan: TLoanRow; start: string }): TInstallment[] =>
  schedule(loan).map((part) => ({
    ...part,
    loanId: loan.id,
    due: addMonths(start, loan.termMonths == null ? 0 : part.seq),
    paid: false,
    payRunId: null,
  }));

export const withInstallments = async (db: TCtx["db"], rows: TLoanRow[]): Promise<TLoan[]> => {
  const installments: TInstallment[] = await db("installments")
    .whereIn(
      "loanId",
      rows.map(({ id }) => id)
    )
    .orderBy("seq")
    .select(installmentColumns);

  return rows.map((row) => {
    const own = installments.filter(({ loanId }) => loanId === row.id);

    return {
      ...row,
      balance: loanBalance({ principal: row.principal, installments: own }),
      nextInstallment: own.find(({ paid }) => !paid) ?? null,
      preview: preview(row),
    };
  });
};

const notFound = () => domainError({ statusCode: 404, code: "not_found", message: "Loan not found." });

export const getLoan = async (db: TCtx["db"], id: string): Promise<TLoan> => {
  const row: TLoanRow | undefined = await loanQuery(db).where("loans.id", id).first();

  if (!row) {
    throw notFound();
  }

  const [loan] = await withInstallments(db, [row]);

  if (!loan) {
    throw notFound();
  }

  return loan;
};

export const requestLoan = async (ctx: TCtx, { type, principal, termMonths }: TLoanRequest): Promise<TLoan> => {
  const plan = await planInEffect(ctx, { employeeId: ctx.actor.id, at: manilaToday(ctx.now) });
  const maxAmount = plan?.maxLoanAmountOverride ?? (await requireValueAt(ctx, "loan.maxAmount", ctx.now));

  if (principal > maxAmount) {
    throw domainError({
      statusCode: 422,
      code: "loan.over_max",
      message: "The amount is over the maximum you can borrow.",
      details: { field: "principal", max: maxAmount },
    });
  }

  if (type === "advance") {
    const id = await insertRecord(ctx, "loans", { employeeId: ctx.actor.id, type, principal, ratePct: 0, method: null, termMonths: null, status: "requested" });

    return getLoan(ctx.db, id);
  }

  if (termMonths == null) {
    throw domainError({ statusCode: 422, code: "validation", message: "A loan needs a term.", details: { field: "termMonths" } });
  }

  const [maxTermMonths, ratePct, method] = await Promise.all([
    requireValueAt(ctx, "loan.maxTermMonths", ctx.now),
    requireValueAt(ctx, "loan.interestRatePct", ctx.now),
    requireValueAt(ctx, "loan.interestMethod", ctx.now),
  ]);

  if (termMonths > maxTermMonths) {
    throw domainError({
      statusCode: 422,
      code: "loan.over_max",
      message: "The term is longer than the maximum allowed.",
      details: { field: "termMonths", max: maxTermMonths },
    });
  }

  const id = await insertRecord(ctx, "loans", { employeeId: ctx.actor.id, type, principal, ratePct, method, termMonths, status: "requested" });

  return getLoan(ctx.db, id);
};

export const listLoans = async (ctx: TCtx, { status, page, pageSize }: TLoanListQuery): Promise<TPage<TLoan>> => {
  const query = loanQuery(ctx.db).orderBy("loans.createdAt", "desc");

  if (status) {
    query.where("loans.status", status);
  }

  const { items, ...rest } = await paginate<TLoanRow>(query, { page, pageSize });

  return { ...rest, items: await withInstallments(ctx.db, items) };
};

export const loanSchedule = async (ctx: TCtx, id: string): Promise<TInstallment[]> => {
  const row: TLoanRow | undefined = await loanQuery(ctx.db).where("loans.id", id).first();

  if (!row) {
    throw notFound();
  }

  if (ctx.actor.activeRole !== "owner" && row.employeeId !== ctx.actor.id) {
    throw domainError({ statusCode: 403, code: "auth.role_forbidden", message: "This loan belongs to another employee." });
  }

  const installments: TInstallment[] = await ctx.db("installments").where({ loanId: id }).orderBy("seq").select(installmentColumns);

  return installments.length ? installments : datedSchedule({ loan: row, start: manilaToday(ctx.now) });
};

const lockRequested = async (ctx: TCtx, id: string) => {
  const loan = await ctx.db("loans").where({ id }).forUpdate().first("id", "status");

  if (!loan) {
    throw notFound();
  }

  if (loan.status !== "requested") {
    throw domainError({
      statusCode: 409,
      code: "approval.not_pending",
      message: "This request has already been decided.",
      details: { status: loan.status },
    });
  }
};

export const releaseLoan = async (ctx: TCtx, { id, authorizationFileId }: TLoanReleaseBody & { id: string }): Promise<TLoan> => {
  await lockRequested(ctx, id);

  const file = await ctx.db("files").where({ id: authorizationFileId }).first("id");

  if (!file) {
    throw domainError({
      statusCode: 422,
      code: "loan.authorization_required",
      message: "Attach the signed IOU photo before releasing.",
      details: { field: "authorizationFileId" },
    });
  }

  const category = await ctx.db("expenseCategories").where({ name: LOAN_EXPENSE_CATEGORY }).first("id");

  if (!category) {
    throw domainError({
      statusCode: 422,
      code: "reference.not_found",
      message: `The "${LOAN_EXPENSE_CATEGORY}" expense category is missing.`,
      details: { field: "categoryId" },
    });
  }

  await ctx.db("loans").where({ id }).update({
    status: "released",
    authorizationFileId,
    approvedBy: ctx.actor.id,
    releasedAt: ctx.now,
    decidedAt: ctx.now,
  });

  const loan = await getLoan(ctx.db, id);

  await createExpense(ctx, {
    categoryId: category.id,
    amount: loan.principal,
    note: `${loan.type === "advance" ? "Advance" : "Loan"} — ${loan.employeeName}`,
  });

  await ctx.db("installments").insert(datedSchedule({ loan, start: manilaToday(ctx.now) }));

  return getLoan(ctx.db, id);
};

export const rejectLoan = async (ctx: TCtx, { id, reason }: TRejectBody & { id: string }): Promise<TLoan> => {
  await lockRequested(ctx, id);
  await ctx.db("loans").where({ id }).update({ status: "rejected", decisionReason: reason, approvedBy: ctx.actor.id, decidedAt: ctx.now });

  return getLoan(ctx.db, id);
};
