import { STOCK_STATUS_LABEL } from "@wrs/contract/labels/consumable";
import { z } from "zod";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { manilaDayBounds } from "../../lib/dates/manilaDayBounds.ts";
import { stockOnHandQuery, stockStatus } from "../stock.ts";
import type { TReportDefinition } from "./types.ts";

const stockRowsSchema = z.array(z.object({ name: z.string(), unit: z.string(), reorderLevel: z.number(), onHand: z.number() }));

const stockAsOf = async ({ db }: TCtx, to: string) => {
  const { end } = manilaDayBounds(to);

  const rows = await db("consumables as c")
    .leftJoin(stockOnHandQuery(db).where("e.createdAt", "<", end).as("s"), "s.consumableId", "c.id")
    .where("c.createdAt", "<", end)
    .select("c.name", "c.unit", "c.reorderLevel", db.raw("coalesce(s.on_hand, 0) as on_hand"))
    .orderBy([{ column: "c.createdAt" }, { column: "c.id" }]);

  return stockRowsSchema.parse(rows).map((row) => ({ ...row, status: stockStatus(row.onHand, row.reorderLevel) }));
};

export const stockReorderReport: TReportDefinition = {
  build: async (ctx, { to }) => {
    const stock = await stockAsOf(ctx, to);

    return {
      columns: [
        { key: "item", label: "Item", align: "left", format: "text" },
        { key: "onHand", label: "On hand", align: "right", format: "number" },
        { key: "reorderLevel", label: "Reorder level", align: "right", format: "number" },
        { key: "status", label: "Status", align: "left", format: "text" },
      ],
      rows: stock.map(({ name, unit, onHand, reorderLevel, status }) => ({
        item: `${name} (${unit})`,
        onHand,
        reorderLevel,
        status: STOCK_STATUS_LABEL[status],
      })),
    };
  },
  summarize: async (ctx, { to }) => {
    const stock = await stockAsOf(ctx, to);
    const toReorder = stock.filter(({ status }) => status === "reorder").length;

    return { slug: "stock-reorder", value: toReorder, count: stock.length, tone: toReorder > 0 ? "warn" : "default" };
  },
};
