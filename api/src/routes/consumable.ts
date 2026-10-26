import { idSchema } from "@wrs/contract/common";
import { consumableCreateSchema, consumableSchema, consumableUpdateSchema, usagesPutBodySchema } from "@wrs/contract/consumable";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { createConsumable, listConsumables, replaceUsages, updateConsumable } from "../domain/consumable.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const consumableRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/consumables", { config: { roles: ["owner", "cashier"] }, schema: { response: { 200: z.array(consumableSchema) } } }, (request) =>
    withTx(request, (ctx) => listConsumables(ctx))
  );

  app.post("/consumables", { config: { roles: ["owner"] }, schema: { body: consumableCreateSchema, response: { 200: consumableSchema } } }, (request) =>
    withTx(request, (ctx) => createConsumable(ctx, request.body))
  );

  app.patch(
    "/consumables/:id",
    { config: { roles: ["owner"] }, schema: { params, body: consumableUpdateSchema, response: { 200: consumableSchema } } },
    (request) => withTx(request, (ctx) => updateConsumable(ctx, { id: request.params.id, ...request.body }))
  );

  app.put(
    "/consumables/:id/usages",
    { config: { roles: ["owner"] }, schema: { params, body: usagesPutBodySchema, response: { 200: consumableSchema } } },
    (request) => withTx(request, (ctx) => replaceUsages(ctx, { id: request.params.id, ...request.body }))
  );
};

export default consumableRoutes;
