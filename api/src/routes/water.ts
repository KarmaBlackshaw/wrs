import { pageOf } from "@wrs/contract/common";
import {
  labTestBodySchema,
  labTestListQuerySchema,
  labTestSchema,
  waterReadingBodySchema,
  waterReadingListQuerySchema,
  waterReadingSchema,
} from "@wrs/contract/water";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { createLabTest, createWaterReading, listLabTests, listWaterReadings } from "../domain/water.ts";
import { withTx } from "../lib/context/withTx.ts";

const readingRoles = ["owner", "cashier", "washer", "helper"] as const;

const waterRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/water-readings",
    { config: { roles: [...readingRoles] }, schema: { querystring: waterReadingListQuerySchema, response: { 200: pageOf(waterReadingSchema) } } },
    (request) => withTx(request, (ctx) => listWaterReadings(ctx, request.query))
  );

  app.post(
    "/water-readings",
    { config: { roles: [...readingRoles] }, schema: { body: waterReadingBodySchema, response: { 200: waterReadingSchema } } },
    (request) => withTx(request, (ctx) => createWaterReading(ctx, request.body))
  );

  app.get(
    "/lab-tests",
    { config: { roles: ["owner"] }, schema: { querystring: labTestListQuerySchema, response: { 200: pageOf(labTestSchema) } } },
    (request) => withTx(request, (ctx) => listLabTests(ctx, request.query))
  );

  app.post("/lab-tests", { config: { roles: ["owner"] }, schema: { body: labTestBodySchema, response: { 200: labTestSchema } } }, (request) =>
    withTx(request, (ctx) => createLabTest(ctx, request.body))
  );
};

export default waterRoutes;
