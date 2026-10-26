import { reportSlugSchema, type TReportQuery, type TReportSlug, type TReportSummary, type TReportTable } from "@wrs/contract/report";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { toCsv } from "../lib/csv/toCsv.ts";
import { manilaDate } from "../lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../lib/dates/manilaToday.ts";
import { DomainError, domainError } from "../lib/errors/domainError.ts";
import { cashierVarianceReport } from "./reports/cashierVariance.ts";
import { containerCountVarianceReport } from "./reports/containerCountVariance.ts";
import { containersHeldReport } from "./reports/containersHeld.ts";
import { creditAgingReport } from "./reports/creditAging.ts";
import { expensesReport } from "./reports/expenses.ts";
import { loanBalancesReport } from "./reports/loanBalances.ts";
import { maintenanceDueReport } from "./reports/maintenanceDue.ts";
import { monthlyProfitReport } from "./reports/monthlyProfit.ts";
import { payrollSummaryReport } from "./reports/payrollSummary.ts";
import { riderReconciliationReport } from "./reports/riderReconciliation.ts";
import { salesReport } from "./reports/sales.ts";
import { shortagesReport } from "./reports/shortages.ts";
import { stockReorderReport } from "./reports/stockReorder.ts";
import type { TReportDefinition } from "./reports/types.ts";
import { waterQualityReport } from "./reports/waterQuality.ts";

const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;

const REPORTS: Record<TReportSlug, TReportDefinition> = {
  "rider-reconciliation": riderReconciliationReport,
  shortages: shortagesReport,
  "cashier-variance": cashierVarianceReport,
  sales: salesReport,
  "credit-aging": creditAgingReport,
  "containers-held": containersHeldReport,
  "container-count-variance": containerCountVarianceReport,
  "stock-reorder": stockReorderReport,
  "maintenance-due": maintenanceDueReport,
  "water-quality": waterQualityReport,
  expenses: expensesReport,
  "payroll-summary": payrollSummaryReport,
  "loan-balances": loanBalancesReport,
  "monthly-profit": monthlyProfitReport,
};

type TReportRequest = TReportQuery & { slug: string };

export const reportRange = (ctx: TCtx, { from, to }: TReportQuery): Required<TReportQuery> => {
  const end = to ?? manilaToday(ctx.now);
  const endStart = manilaDayBounds(end).start.getTime();
  const start = from ?? manilaDate(new Date(endStart - (DEFAULT_RANGE_DAYS - 1) * DAY_MS));

  if (endStart - manilaDayBounds(start).start.getTime() >= MAX_RANGE_DAYS * DAY_MS) {
    throw new DomainError({
      statusCode: 400,
      code: "validation",
      message: `The date range can't be longer than ${MAX_RANGE_DAYS} days.`,
      details: { field: "from" },
    });
  }

  return { from: start, to: end };
};

const reportFor = (slug: string) => {
  const parsed = reportSlugSchema.safeParse(slug);

  if (!parsed.success) {
    throw domainError({ statusCode: 404, code: "not_found", message: "Report not found.", details: { slug } });
  }

  return { slug: parsed.data, report: REPORTS[parsed.data] };
};

export const reportSummaries = (ctx: TCtx, query: TReportQuery): Promise<TReportSummary[]> => {
  const range = reportRange(ctx, query);

  return Promise.all(reportSlugSchema.options.map((slug) => REPORTS[slug].summarize(ctx, range)));
};

export const reportTable = (ctx: TCtx, { slug, ...query }: TReportRequest): Promise<TReportTable> => reportFor(slug).report.build(ctx, reportRange(ctx, query));

export const reportCsv = async (ctx: TCtx, { slug, ...query }: TReportRequest) => {
  const { slug: reportSlug, report } = reportFor(slug);
  const range = reportRange(ctx, query);
  const table = await report.build(ctx, range);

  return { filename: `${reportSlug}_${range.from}_${range.to}.csv`, csv: toCsv(table) };
};
