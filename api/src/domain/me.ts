import type { TMeSummary } from "@wrs/contract/me";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { ptoBalance } from "./employee.ts";
import { loanQuery, withInstallments } from "./loan.ts";

export const getMeSummary = async (ctx: TCtx, employeeId: string): Promise<TMeSummary> => {
  const [payslips, loanRows, pto] = await Promise.all([
    ctx
      .db("payLines as l")
      .join("payRuns as r", "r.id", "l.runId")
      .where({ "l.employeeId": employeeId, "r.status": "finalized" })
      .orderBy("r.periodEnd", "desc")
      .select("l.runId", "r.periodStart", "r.periodEnd", "l.net"),
    loanQuery(ctx.db).where("loans.employeeId", employeeId).orderBy("loans.createdAt", "desc"),
    ptoBalance(ctx, { employeeId, year: Number(manilaToday(ctx.now).slice(0, 4)) }),
  ]);

  return { payslips, loans: await withInstallments(ctx.db, loanRows), pto };
};
