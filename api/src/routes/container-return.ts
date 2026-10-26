import { containerReturnBodySchema, containerReturnQuoteSchema } from "@wrs/contract/container";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { quoteContainerReturn, returnContainers } from "../domain/container-return.ts";
import { withTx } from "../lib/context/withTx.ts";

const containerReturnRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/container-returns/quote",
    { config: { roles: ["cashier"] }, schema: { body: containerReturnBodySchema, response: { 200: containerReturnQuoteSchema } } },
    (request) => withTx(request, (ctx) => quoteContainerReturn(ctx, request.body))
  );

  app.post(
    "/container-returns",
    { config: { roles: ["cashier"] }, schema: { body: containerReturnBodySchema, response: { 200: containerReturnQuoteSchema } } },
    (request) => withTx(request, (ctx) => returnContainers(ctx, request.body))
  );
};

export default containerReturnRoutes;
