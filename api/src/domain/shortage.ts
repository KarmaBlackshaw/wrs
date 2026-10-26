import type { TShortage, TShortageBody, TShortageStatus } from "@wrs/contract/shortage";
import { insertRecord } from "../lib/context/insertRecord.ts";
import type { TCtx } from "../lib/context/makeCtx.ts";
import { domainError } from "../lib/errors/domainError.ts";
import { fullNameSql } from "../lib/sql/fullNameSql.ts";

type TShortageRow = Omit<TShortage, "status">;

export const shortageStatus = ({ deductedRunId, dismissedAt }: Pick<TShortage, "deductedRunId" | "dismissedAt">): TShortageStatus => {
  if (deductedRunId != null) {
    return "deducted";
  }

  return dismissedAt != null ? "dismissed" : "pending";
};

const shortageQuery = (db: TCtx["db"]) =>
  db("shortages as s")
    .join("employees as e", "e.id", "s.employeeId")
    .leftJoin("employees as d", "d.id", "s.dismissedBy")
    .select(
      "s.id",
      "s.employeeId",
      db.raw(`${fullNameSql("e")} as employee_name`),
      "s.source",
      "s.refId",
      "s.cash",
      "s.containers",
      "s.excludedRunId",
      "s.exclusionReason",
      "s.deductedRunId",
      "s.dismissedAt",
      "s.dismissReason",
      "s.dismissedBy as dismissedById",
      db.raw(`${fullNameSql("d")} as dismissed_by_name`),
      "s.createdAt",
      "s.updatedAt"
    );

const toShortage = (row: TShortageRow): TShortage => ({ ...row, status: shortageStatus(row) });

export const deductibleShortages = async (ctx: TCtx, { employeeId, runId }: { employeeId: string; runId: string }): Promise<TShortage[]> => {
  const rows: TShortageRow[] = await shortageQuery(ctx.db)
    .where("s.employeeId", employeeId)
    .whereNull("s.deductedRunId")
    .whereNull("s.dismissedAt")
    .where((builder) => builder.whereNull("s.excludedRunId").orWhereNot("s.excludedRunId", runId))
    .orderBy([{ column: "s.createdAt" }, { column: "s.id" }]);

  return rows.map(toShortage);
};

export const recordShortage = async (ctx: TCtx, { refId, cash, containers }: TShortageBody): Promise<TShortage> => {
  if (cash === 0 && containers === 0) {
    throw domainError({ statusCode: 422, code: "validation", message: "A shortage needs cash or containers.", details: { field: "cash" } });
  }

  const trip: { riderId: string; status: string } | undefined = await ctx.db("trips").where({ id: refId }).forUpdate().first("riderId", "status");

  if (!trip) {
    throw domainError({ statusCode: 422, code: "reference.not_found", message: "Trip not found.", details: { field: "refId" } });
  }

  if (trip.status !== "returned" && trip.status !== "reconciled") {
    ctx.violation("trip.not_returned", "A shortage can only be recorded on a received trip.", { status: trip.status });
  }

  const existing = await ctx.db("shortages").where({ source: "trip", refId }).whereNull("dismissedAt").first("id");

  if (existing) {
    throw domainError({ statusCode: 409, code: "conflict", message: "A shortage is already recorded for this trip.", details: { shortageId: existing.id } });
  }

  const id = await insertRecord(ctx, "shortages", { employeeId: trip.riderId, source: "trip", refId, cash, containers });
  const row: TShortageRow = await shortageQuery(ctx.db).where("s.id", id).first();

  return toShortage(row);
};
