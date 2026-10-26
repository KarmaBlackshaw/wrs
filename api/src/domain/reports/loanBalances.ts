import { LOAN_STATUS_LABEL, LOAN_TYPE_LABEL } from "@wrs/contract/labels/loan";
import type { TInstallment, TLoan } from "@wrs/contract/loan";
import type { TReportColumn } from "@wrs/contract/report";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { loanBalance, loanQuery } from "../loan.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

type TLoanRow = Pick<TLoan, "id" | "employeeName" | "type" | "principal" | "status">;

type TInstallmentRow = Pick<TInstallment, "loanId" | "principalPart" | "paid"> & { finalizedAt: string | null };

const COLUMNS: TReportColumn[] = [
  { key: "employee", label: "Employee", align: "left", format: "text" },
  { key: "type", label: "Type", align: "left", format: "text" },
  { key: "principal", label: "Principal", align: "right", format: "money" },
  { key: "status", label: "Status", align: "left", format: "text" },
  { key: "balance", label: "Balance", align: "right", format: "money" },
];

const balances = async ({ db }: TCtx, { to }: TRange) => {
  const end = manilaDayBounds(to).end;

  const loans: TLoanRow[] = await loanQuery(db)
    .where("loans.releasedAt", "<", end)
    .orderBy([
      { column: "loans.releasedAt", order: "desc" },
      { column: "loans.id", order: "desc" },
    ]);

  const installments: TInstallmentRow[] = await db("installments as i")
    .leftJoin("payRuns as r", "r.id", "i.payRunId")
    .whereIn(
      "i.loanId",
      loans.map(({ id }) => id)
    )
    .select("i.loanId", "i.principalPart", "i.paid", "r.finalizedAt");

  return loans
    .map((loan) => {
      const own = installments
        .filter(({ loanId }) => loanId === loan.id)
        .map(({ principalPart, paid, finalizedAt }) => ({ principalPart, paid: paid && (finalizedAt == null || new Date(finalizedAt) < end) }));

      return { ...loan, balance: loanBalance({ principal: loan.principal, installments: own }) };
    })
    .filter(({ balance }) => balance > 0);
};

export const loanBalancesReport: TReportDefinition = {
  build: async (ctx, range) => {
    const rows = await balances(ctx, range);

    return {
      columns: COLUMNS,
      rows: rows.map(({ employeeName, type, principal, status, balance }) => ({
        employee: employeeName,
        type: LOAN_TYPE_LABEL[type],
        principal,
        status: LOAN_STATUS_LABEL[status],
        balance,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const rows = await balances(ctx, range);

    return { slug: "loan-balances", value: rows.reduce((sum, { balance }) => sum + balance, 0), count: rows.length, tone: "default" };
  },
};
