import type { TRole } from "@wrs/contract/auth";
import { idSchema } from "@wrs/contract/common";
import {
  payAdjustmentBodySchema,
  payLineDaysBodySchema,
  payRunCreateSchema,
  payRunDetailSchema,
  payRunSchema,
  shortageDismissBodySchema,
  shortageExcludeBodySchema,
} from "@wrs/contract/payroll";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  addPayAdjustment,
  createPayRun,
  dismissPayRunShortage,
  excludePayRunShortage,
  finalizePayRun,
  getPayRun,
  listPayRuns,
  recomputePayRun,
  updatePayLineDays,
} from "../domain/payroll.ts";
import { withTx } from "../lib/context/withTx.ts";

const config: { roles: TRole[] } = { roles: ["owner"] };
const params = z.object({ id: idSchema });
const lineParams = params.extend({ employeeId: idSchema });
const shortageParams = params.extend({ shortageId: idSchema });
const response = { 200: payRunDetailSchema };

const payrollRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/pay-runs", { config, schema: { response: { 200: z.array(payRunSchema) } } }, (request) => withTx(request, (ctx) => listPayRuns(ctx)));

  app.post("/pay-runs", { config, schema: { body: payRunCreateSchema, response } }, (request) => withTx(request, (ctx) => createPayRun(ctx, request.body)));

  app.get("/pay-runs/:id", { config, schema: { params, response } }, (request) => withTx(request, (ctx) => getPayRun(ctx, request.params.id)));

  app.patch("/pay-runs/:id/lines/:employeeId", { config, schema: { params: lineParams, body: payLineDaysBodySchema, response } }, (request) =>
    withTx(request, (ctx) => updatePayLineDays(ctx, { ...request.params, ...request.body }))
  );

  app.post("/pay-runs/:id/adjustments", { config, schema: { params, body: payAdjustmentBodySchema, response } }, (request) =>
    withTx(request, (ctx) => addPayAdjustment(ctx, { id: request.params.id, ...request.body }))
  );

  app.post("/pay-runs/:id/recompute", { config, schema: { params, response } }, (request) => withTx(request, (ctx) => recomputePayRun(ctx, request.params.id)));

  app.post("/pay-runs/:id/finalize", { config, schema: { params, response } }, (request) => withTx(request, (ctx) => finalizePayRun(ctx, request.params.id)));

  app.post(
    "/pay-runs/:id/shortages/:shortageId/exclude",
    { config, schema: { params: shortageParams, body: shortageExcludeBodySchema, response } },
    (request) => withTx(request, (ctx) => excludePayRunShortage(ctx, { ...request.params, ...request.body }))
  );

  app.post(
    "/pay-runs/:id/shortages/:shortageId/dismiss",
    { config, schema: { params: shortageParams, body: shortageDismissBodySchema, response } },
    (request) => withTx(request, (ctx) => dismissPayRunShortage(ctx, { ...request.params, ...request.body }))
  );
};

export default payrollRoutes;
