import { CONTAINER_TYPE_LABEL } from "@wrs/contract/labels/container";
import { listCounts } from "../container-log.ts";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { allPages } from "./allPages.ts";
import type { TReportDefinition } from "./types.ts";

type TRange = Parameters<TReportDefinition["build"]>[1];

const countsIn = (ctx: TCtx, range: TRange) => allPages((page) => listCounts(ctx, { ...range, ...page }));

export const containerCountVarianceReport: TReportDefinition = {
  build: async (ctx, range) => {
    const counts = await countsIn(ctx, range);

    return {
      columns: [
        { key: "date", label: "Date", align: "left", format: "date" },
        { key: "type", label: "Type", align: "left", format: "text" },
        { key: "countedFull", label: "Counted full", align: "right", format: "number" },
        { key: "expectedFull", label: "Expected full", align: "right", format: "number" },
        { key: "varianceFull", label: "Variance full", align: "right", format: "number" },
        { key: "countedEmpty", label: "Counted empty", align: "right", format: "number" },
        { key: "expectedEmpty", label: "Expected empty", align: "right", format: "number" },
        { key: "varianceEmpty", label: "Variance empty", align: "right", format: "number" },
      ],
      rows: counts.map(({ date, containerType, full, expectedFull, varianceFull, empty, expectedEmpty, varianceEmpty }) => ({
        date,
        type: CONTAINER_TYPE_LABEL[containerType],
        countedFull: full,
        expectedFull,
        varianceFull,
        countedEmpty: empty,
        expectedEmpty,
        varianceEmpty,
      })),
    };
  },
  summarize: async (ctx, range) => {
    const counts = await countsIn(ctx, range);
    const off = counts.filter(({ varianceFull, varianceEmpty }) => varianceFull !== 0 || varianceEmpty !== 0).length;

    return { slug: "container-count-variance", value: off, count: counts.length, tone: off > 0 ? "warn" : "default" };
  },
};
