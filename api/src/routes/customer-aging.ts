import { creditAgingSchema } from "@wrs/contract/customer";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { creditAging } from "../domain/customer-aging.ts";
import { withTx } from "../lib/context/withTx.ts";

const customerAgingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/customers/aging", { config: { roles: ["owner"] }, schema: { response: { 200: creditAgingSchema } } }, (request) =>
    withTx(request, (ctx) => creditAging(ctx))
  );
};

export default customerAgingRoutes;
