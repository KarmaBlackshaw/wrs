import { SHORTAGE_SOURCE_LABEL } from "@wrs/contract/labels/shortage";
import type { TReportColumn } from "@wrs/contract/report";
import type { TShortage } from "@wrs/contract/shortage";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDate } from "../../lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { fullNameSql } from "../../lib/sql/fullNameSql.ts";
import { shortageStatus } from "../shortage.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

type TShortageRow = Pick<TShortage, "employeeName" | "source" | "cash" | "containers" | "excludedRunId" | "deductedRunId" | "dismissedAt" | "createdAt">;

const COLUMNS: TReportColumn[] = [
  { key: "date", label: "Date", align: "left", format: "date" },
  { key: "employee", label: "Employee", align: "left", format: "text" },
  { key: "source", label: "Source", align: "left", format: "text" },
  { key: "cash", label: "Cash", align: "right", format: "money" },
  { key: "containers", label: "Containers", align: "right", format: "number" },
  { key: "status", label: "Status", align: "left", format: "text" },
];

const statusLabel = (row: TShortageRow) => {
  const status = shortageStatus(row);

  if (status === "pending") {
    return row.excludedRunId == null ? "Pending" : "Excluded";
  }

  return status === "deducted" ? "Deducted" : "Dismissed";
};

const shortages = ({ db }: TCtx, { from, to }: TRange): Promise<TShortageRow[]> =>
  db("shortages as s")
    .join("employees as e", "e.id", "s.employeeId")
    .where("s.createdAt", ">=", manilaDayBounds(from).start)
    .where("s.createdAt", "<", manilaDayBounds(to).end)
    .select(
      db.raw(`${fullNameSql("e")} as employee_name`),
      "s.source",
      "s.cash",
      "s.containers",
      "s.excludedRunId",
      "s.deductedRunId",
      "s.dismissedAt",
      "s.createdAt"
    )
    .orderBy([
      { column: "s.createdAt", order: "desc" },
      { column: "s.id", order: "desc" },
    ]);

export const shortagesReport: TReportDefinition = {
  build: async (ctx, range) => {
    const rows = await shortages(ctx, range);

    return {
      columns: COLUMNS,
      rows: rows.map((row) => ({
        date: manilaDate(new Date(row.createdAt)),
        employee: row.employeeName,
        source: SHORTAGE_SOURCE_LABEL[row.source],
        cash: row.cash,
        containers: row.containers,
        status: statusLabel(row),
      })),
    };
  },
  summarize: async (ctx, range) => {
    const rows = await shortages(ctx, range);
    const pending = rows.filter((row) => shortageStatus(row) === "pending").length;

    return { slug: "shortages", value: pending, count: rows.length, tone: pending > 0 ? "warn" : "default" };
  },
};
