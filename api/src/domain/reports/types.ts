import type { TReportSummary, TReportTable } from "@wrs/contract/report";
import type { TCtx } from "../../lib/context/makeCtx.ts";

type TReportRange = { from: string; to: string };

export type TReportDefinition = {
  build: (ctx: TCtx, range: TReportRange) => Promise<TReportTable>;
  summarize: (ctx: TCtx, range: TReportRange) => Promise<TReportSummary>;
};
