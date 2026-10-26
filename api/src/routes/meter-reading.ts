import { pageOf } from "@wrs/contract/common";
import type { TRole } from "@wrs/contract/auth";
import { meterReadingBodySchema, meterReadingListQuerySchema, meterReadingSchema } from "@wrs/contract/maintenance";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listMeterReadings, logMeterReading } from "../domain/meter-reading.ts";
import { withTx } from "../lib/context/withTx.ts";

const roles: TRole[] = ["owner", "cashier", "washer", "helper"];

const meterReadingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/meter-readings",
    { config: { roles }, schema: { querystring: meterReadingListQuerySchema, response: { 200: pageOf(meterReadingSchema) } } },
    (request) => withTx(request, (ctx) => listMeterReadings(ctx, request.query))
  );

  app.post("/meter-readings", { config: { roles }, schema: { body: meterReadingBodySchema, response: { 200: meterReadingSchema } } }, (request) =>
    withTx(request, (ctx) => logMeterReading(ctx, request.body))
  );
};

export default meterReadingRoutes;
