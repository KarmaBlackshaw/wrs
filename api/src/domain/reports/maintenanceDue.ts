import type { TMaintenanceStatus } from "@wrs/contract/maintenance";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { listMaintenance } from "../maintenance.ts";
import type { TReportDefinition } from "./types.ts";

const maintenanceAsOf = (ctx: TCtx, to: string) => {
  const { end } = manilaDayBounds(to);

  return listMaintenance({ ...ctx, now: new Date(Math.min(end.getTime() - 1, ctx.now.getTime())) });
};

const STATUS_LABEL: Record<TMaintenanceStatus, string> = { ok: "OK", due: "Due soon", overdue: "Overdue" };

export const maintenanceDueReport: TReportDefinition = {
  build: async (ctx, { to }) => {
    const items = await maintenanceAsOf(ctx, to);

    return {
      columns: [
        { key: "item", label: "Item", align: "left", format: "text" },
        { key: "lastReplaced", label: "Last replaced", align: "left", format: "datetime" },
        { key: "litersSince", label: "Liters since", align: "right", format: "number" },
        { key: "daysSince", label: "Days since", align: "right", format: "number" },
        { key: "status", label: "Status", align: "left", format: "text" },
      ],
      rows: items.map(({ name, lastReplacedAt, litersSince, daysSince, status }) => ({
        item: name,
        lastReplaced: lastReplacedAt,
        litersSince,
        daysSince,
        status: STATUS_LABEL[status],
      })),
    };
  },
  summarize: async (ctx, { to }) => {
    const items = await maintenanceAsOf(ctx, to);
    const due = items.filter(({ status }) => status !== "ok").length;

    return { slug: "maintenance-due", value: due, count: items.length, tone: due > 0 ? "warn" : "default" };
  },
};
