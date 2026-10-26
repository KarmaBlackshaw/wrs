import { TRIP_STATUS_LABEL } from "@wrs/contract/labels/trip";
import type { TReportColumn } from "@wrs/contract/report";
import type { TTripStatus } from "@wrs/contract/trip";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDate } from "../../lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { fullNameSql } from "../../lib/sql/fullNameSql.ts";
import { tripSummaryQuery } from "../trip.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

type TTripRow = {
  loadedAt: string;
  riderName: string;
  status: TTripStatus;
  loaded: number;
  delivered: number;
  returnedFull: number;
  returnedEmpty: number;
  expectedCash: number;
  cashRemitted: number | null;
};

const COLUMNS: TReportColumn[] = [
  { key: "date", label: "Date", align: "left", format: "date" },
  { key: "rider", label: "Rider", align: "left", format: "text" },
  { key: "status", label: "Status", align: "left", format: "text" },
  { key: "loaded", label: "Loaded", align: "right", format: "number" },
  { key: "delivered", label: "Delivered", align: "right", format: "number" },
  { key: "returnedFull", label: "Returned full", align: "right", format: "number" },
  { key: "returnedEmpty", label: "Returned empty", align: "right", format: "number" },
  { key: "expectedCash", label: "Expected cash", align: "right", format: "money" },
  { key: "cashRemitted", label: "Cash remitted", align: "right", format: "money" },
  { key: "cashVariance", label: "Cash variance", align: "right", format: "money" },
];

const cashVariance = ({ cashRemitted, expectedCash }: TTripRow) => (cashRemitted == null ? null : cashRemitted - expectedCash);

const trips = async ({ db }: TCtx, { from, to }: TRange) => {
  const start = manilaDayBounds(from).start;
  const end = manilaDayBounds(to).end;

  const lineTotals = db("tripLines").groupBy("tripId").select("tripId").sum({ loaded: "loaded", returnedFull: "returnedFull", returnedEmpty: "returnedEmpty" });

  const deliveredTotals = db("deliveryLines as l")
    .join("deliveries as d", "d.id", "l.deliveryId")
    .whereNull("d.voidedAt")
    .groupBy("d.tripId")
    .select("d.tripId")
    .sum({ delivered: "l.qty" });

  const rows: TTripRow[] = await db("trips as t")
    .join("employees as r", "r.id", "t.riderId")
    .join(tripSummaryQuery(db).where("t.loadedAt", ">=", start).where("t.loadedAt", "<", end).as("s"), "s.tripId", "t.id")
    .leftJoin(lineTotals.as("tl"), "tl.tripId", "t.id")
    .leftJoin(deliveredTotals.as("dl"), "dl.tripId", "t.id")
    .select(
      "t.loadedAt",
      db.raw(`${fullNameSql("r")} as rider_name`),
      "t.status",
      db.raw("coalesce(tl.loaded, 0) as loaded"),
      db.raw("coalesce(dl.delivered, 0) as delivered"),
      db.raw("coalesce(tl.returned_full, 0) as returned_full"),
      db.raw("coalesce(tl.returned_empty, 0) as returned_empty"),
      "s.expectedCash",
      "t.cashRemitted"
    )
    .orderBy([
      { column: "t.loadedAt", order: "desc" },
      { column: "t.id", order: "desc" },
    ]);

  return rows;
};

export const riderReconciliationReport: TReportDefinition = {
  build: async (ctx, range) => {
    const rows = await trips(ctx, range);

    return {
      columns: COLUMNS,
      rows: rows.map((row) => ({
        date: manilaDate(new Date(row.loadedAt)),
        rider: row.riderName,
        status: TRIP_STATUS_LABEL[row.status],
        loaded: row.loaded,
        delivered: row.delivered,
        returnedFull: row.returnedFull,
        returnedEmpty: row.returnedEmpty,
        expectedCash: row.expectedCash,
        cashRemitted: row.cashRemitted,
        cashVariance: cashVariance(row),
      })),
    };
  },
  summarize: async (ctx, range) => {
    const rows = await trips(ctx, range);
    const variance = rows.reduce((sum, row) => sum + (cashVariance(row) ?? 0), 0);

    return { slug: "rider-reconciliation", value: variance, count: rows.length, tone: variance !== 0 ? "warn" : "default" };
  },
};
