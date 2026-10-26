import { rejectBodySchema } from "@wrs/contract/approval";
import { idSchema, pageOf } from "@wrs/contract/common";
import { installmentSchema, loanListQuerySchema, loanReleaseBodySchema, loanRequestSchema, loanSchema } from "@wrs/contract/loan";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { listLoans, loanSchedule, rejectLoan, releaseLoan, requestLoan } from "../domain/loan.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const loanRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/loans", { schema: { body: loanRequestSchema, response: { 200: loanSchema } } }, (request) =>
    withTx(request, (ctx) => requestLoan(ctx, request.body))
  );

  app.get("/loans", { config: { roles: ["owner"] }, schema: { querystring: loanListQuerySchema, response: { 200: pageOf(loanSchema) } } }, (request) =>
    withTx(request, (ctx) => listLoans(ctx, request.query))
  );

  app.get("/loans/:id/schedule", { schema: { params, response: { 200: z.array(installmentSchema) } } }, (request) =>
    withTx(request, (ctx) => loanSchedule(ctx, request.params.id))
  );

  app.post("/loans/:id/release", { config: { roles: ["owner"] }, schema: { params, body: loanReleaseBodySchema, response: { 200: loanSchema } } }, (request) =>
    withTx(request, (ctx) => releaseLoan(ctx, { id: request.params.id, ...request.body }))
  );

  app.post("/loans/:id/reject", { config: { roles: ["owner"] }, schema: { params, body: rejectBodySchema, response: { 200: loanSchema } } }, (request) =>
    withTx(request, (ctx) => rejectLoan(ctx, { id: request.params.id, ...request.body }))
  );
};

export default loanRoutes;
