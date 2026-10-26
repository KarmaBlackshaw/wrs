import { meSchema } from "@wrs/contract/auth";
import { meSummarySchema } from "@wrs/contract/me";
import { idSchema } from "@wrs/contract/common";
import { payslipSchema } from "@wrs/contract/payroll";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db.ts";
import { findMe } from "../domain/auth.ts";
import { getMeSummary } from "../domain/me.ts";
import { payslip } from "../domain/payroll-line.ts";
import { withTx } from "../lib/context/withTx.ts";

const meRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/me", { schema: { response: { 200: meSchema } } }, async (request) => findMe(db, request.actor.id));

  app.get("/me/summary", { schema: { response: { 200: meSummarySchema } } }, (request) => withTx(request, (ctx) => getMeSummary(ctx, request.actor.id)));

  app.get("/me/payslips/:runId", { schema: { params: z.object({ runId: idSchema }), response: { 200: payslipSchema } } }, (request) =>
    withTx(request, (ctx) => payslip(ctx, { runId: request.params.runId, employeeId: request.actor.id }))
  );
};

export default meRoutes;
