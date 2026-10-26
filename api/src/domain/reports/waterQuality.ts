import { listWaterReadings } from "../water.ts";
import { allPages } from "./allPages.ts";
import type { TReportDefinition } from "./types.ts";

export const waterQualityReport: TReportDefinition = {
  build: async (ctx, range) => {
    const readings = await allPages((page) => listWaterReadings(ctx, { ...range, ...page }));

    return {
      columns: [
        { key: "date", label: "Date", align: "left", format: "datetime" },
        { key: "tds", label: "TDS", align: "right", format: "number" },
        { key: "ph", label: "pH", align: "right", format: "number" },
        { key: "outOfRange", label: "Out of range", align: "left", format: "text" },
        { key: "by", label: "Logged by", align: "left", format: "text" },
      ],
      rows: readings.map(({ at, tds, ph, isOutOfRange, loggedByName }) => ({
        date: at,
        tds,
        ph,
        outOfRange: isOutOfRange ? "Yes" : "No",
        by: loggedByName,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const {
      items: [latest],
      total,
    } = await listWaterReadings(ctx, { ...range, page: 1, pageSize: 1 });

    return { slug: "water-quality", value: latest?.tds ?? null, count: total, tone: latest?.isOutOfRange ? "warn" : "default" };
  },
};
