import { pageOf } from "@wrs/contract/common";
import {
  containerCountBodySchema,
  containerCountListQuerySchema,
  containerCountSchema,
  containerMovementSchema,
  holdingListQuerySchema,
  holdingSchema,
  movementCreateSchema,
  movementListQuerySchema,
} from "@wrs/contract/container";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { createMovement, listCounts, listHoldings, listMovements, submitCounts } from "../domain/container-log.ts";
import { withTx } from "../lib/context/withTx.ts";

const containerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/containers/holdings",
    { config: { roles: ["owner", "cashier"] }, schema: { querystring: holdingListQuerySchema, response: { 200: pageOf(holdingSchema) } } },
    (request) => withTx(request, (ctx) => listHoldings(ctx, request.query))
  );

  app.get(
    "/container-movements",
    { config: { roles: ["owner"] }, schema: { querystring: movementListQuerySchema, response: { 200: pageOf(containerMovementSchema) } } },
    (request) => withTx(request, (ctx) => listMovements(ctx, request.query))
  );

  app.post(
    "/container-movements",
    { config: { roles: ["owner"] }, schema: { body: movementCreateSchema, response: { 200: containerMovementSchema } } },
    (request) => withTx(request, (ctx) => createMovement(ctx, request.body))
  );

  app.get(
    "/container-counts",
    { config: { roles: ["owner"] }, schema: { querystring: containerCountListQuerySchema, response: { 200: pageOf(containerCountSchema) } } },
    (request) => withTx(request, (ctx) => listCounts(ctx, request.query))
  );

  app.post(
    "/container-counts",
    { config: { roles: ["cashier"] }, schema: { body: containerCountBodySchema, response: { 200: z.array(containerCountSchema) } } },
    (request) => withTx(request, (ctx) => submitCounts(ctx, request.body))
  );
};

export default containerRoutes;
