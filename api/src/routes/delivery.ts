import { pageOf } from "@wrs/contract/common";
import { deliveryListQuerySchema, deliverySchema } from "@wrs/contract/trip";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listDeliveries } from "../domain/delivery.ts";
import { withTx } from "../lib/context/withTx.ts";

const deliveryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/deliveries",
    { config: { roles: ["owner", "cashier", "rider"] }, schema: { querystring: deliveryListQuerySchema, response: { 200: pageOf(deliverySchema) } } },
    (request) => withTx(request, (ctx) => listDeliveries(ctx, request.query))
  );
};

export default deliveryRoutes;
