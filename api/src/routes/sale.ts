import {
  salesListQuerySchema,
  salesPageSchema,
  walkInSaleBodySchema,
  walkInSaleQuoteBodySchema,
  walkInSaleQuoteSchema,
  walkInSaleSchema,
} from "@wrs/contract/sale";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listSales, quoteSale, recordSale } from "../domain/sale.ts";
import { withTx } from "../lib/context/withTx.ts";

const saleRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/walk-in-sales/quote",
    { config: { roles: ["cashier"] }, schema: { body: walkInSaleQuoteBodySchema, response: { 200: walkInSaleQuoteSchema } } },
    (request) => withTx(request, (ctx) => quoteSale(ctx, request.body))
  );

  app.post("/walk-in-sales", { config: { roles: ["cashier"] }, schema: { body: walkInSaleBodySchema, response: { 200: walkInSaleSchema } } }, (request) =>
    withTx(request, (ctx) => recordSale(ctx, request.body))
  );

  app.get("/sales", { config: { roles: ["owner"] }, schema: { querystring: salesListQuerySchema, response: { 200: salesPageSchema } } }, (request) =>
    withTx(request, (ctx) => listSales(ctx, request.query))
  );
};

export default saleRoutes;
