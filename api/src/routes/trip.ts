import { idSchema, pageOf } from "@wrs/contract/common";
import { loadOutBodySchema, receiveBodySchema, tripDetailSchema, tripListQuerySchema, tripSchema } from "@wrs/contract/trip";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getTripDetail, listTrips, loadOutTrip, receiveTrip, reconcileTrip } from "../domain/trip.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const tripRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/trips",
    { config: { roles: ["cashier", "owner", "rider"] }, schema: { querystring: tripListQuerySchema, response: { 200: pageOf(tripSchema) } } },
    (request) => withTx(request, (ctx) => listTrips(ctx, request.query))
  );

  app.get("/trips/:id", { config: { roles: ["cashier", "owner", "rider"] }, schema: { params, response: { 200: tripDetailSchema } } }, (request) =>
    withTx(request, (ctx) => getTripDetail(ctx, request.params.id))
  );

  app.post("/trips", { config: { roles: ["cashier"] }, schema: { body: loadOutBodySchema, response: { 200: tripDetailSchema } } }, (request) =>
    withTx(request, (ctx) => loadOutTrip(ctx, request.body))
  );

  app.post(
    "/trips/:id/receive",
    { config: { roles: ["cashier"] }, schema: { params, body: receiveBodySchema, response: { 200: tripDetailSchema } } },
    (request) => withTx(request, (ctx) => receiveTrip(ctx, { ...request.body, tripId: request.params.id }))
  );

  app.post("/trips/:id/reconcile", { config: { roles: ["cashier", "owner"] }, schema: { params, response: { 200: tripDetailSchema } } }, (request) =>
    withTx(request, (ctx) => reconcileTrip(ctx, request.params.id))
  );
};

export default tripRoutes;
