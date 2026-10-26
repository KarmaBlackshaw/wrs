import { CONTAINER_TYPE_LABEL } from "@wrs/contract/labels/container";
import { listHoldings } from "../container-log.ts";
import type { TCtx } from "../../lib/context/makeCtx.ts";
import { allPages } from "./allPages.ts";
import type { TReportDefinition } from "./types.ts";

const holdingsAt = (ctx: TCtx, at: string) => allPages((page) => listHoldings(ctx, { at, ...page }));

export const containersHeldReport: TReportDefinition = {
  build: async (ctx, { to }) => {
    const holdings = await holdingsAt(ctx, to);

    return {
      columns: [
        { key: "location", label: "Location", align: "left", format: "text" },
        { key: "type", label: "Type", align: "left", format: "text" },
        { key: "full", label: "Full", align: "right", format: "number" },
        { key: "empty", label: "Empty", align: "right", format: "number" },
        { key: "total", label: "Total", align: "right", format: "number" },
      ],
      rows: holdings.map(({ locationKind, label, containerType, full, empty }) => {
        const isCustomer = locationKind === "customer";

        return {
          location: label,
          type: CONTAINER_TYPE_LABEL[containerType],
          full: isCustomer ? null : full,
          empty: isCustomer ? null : empty,
          total: full + empty,
        };
      }),
    };
  },
  summarize: async (ctx, { to }) => {
    const holdings = await holdingsAt(ctx, to);

    return {
      slug: "containers-held",
      value: holdings.reduce((sum, { full, empty }) => sum + full + empty, 0),
      count: holdings.length,
      tone: "default",
    };
  },
};
