import { shortageBodySchema, shortageSchema } from "@wrs/contract/shortage";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { recordShortage } from "../domain/shortage.ts";
import { withTx } from "../lib/context/withTx.ts";

const shortageRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/shortages", { config: { roles: ["cashier", "owner"] }, schema: { body: shortageBodySchema, response: { 200: shortageSchema } } }, (request) =>
    withTx(request, (ctx) => recordShortage(ctx, request.body))
  );
};

export default shortageRoutes;
