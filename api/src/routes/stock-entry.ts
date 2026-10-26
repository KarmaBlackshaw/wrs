import { pageOf } from "@wrs/contract/common";
import { stockEntryBodySchema, stockEntryListQuerySchema, stockEntrySchema } from "@wrs/contract/consumable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listStockEntries, recordStockEntry } from "../domain/consumable.ts";
import { withTx } from "../lib/context/withTx.ts";

const stockEntryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/stock-entries",
    { config: { roles: ["owner"] }, schema: { querystring: stockEntryListQuerySchema, response: { 200: pageOf(stockEntrySchema) } } },
    (request) => withTx(request, (ctx) => listStockEntries(ctx, request.query))
  );

  app.post(
    "/stock-entries",
    { config: { roles: ["owner", "cashier"] }, schema: { body: stockEntryBodySchema, response: { 200: stockEntrySchema } } },
    (request) => withTx(request, (ctx) => recordStockEntry(ctx, request.body))
  );
};

export default stockEntryRoutes;
