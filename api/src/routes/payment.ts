import { pageOf } from "@wrs/contract/common";
import { paymentCreateSchema, paymentListQuerySchema, paymentSchema } from "@wrs/contract/payment";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listPayments, recordPayment } from "../domain/payment.ts";
import { withTx } from "../lib/context/withTx.ts";

const paymentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/payments", { config: { roles: ["cashier"] }, schema: { body: paymentCreateSchema, response: { 200: paymentSchema } } }, (request) =>
    withTx(request, (ctx) => recordPayment(ctx, request.body))
  );

  app.get("/payments", { config: { roles: ["owner"] }, schema: { querystring: paymentListQuerySchema, response: { 200: pageOf(paymentSchema) } } }, (request) =>
    withTx(request, (ctx) => listPayments(ctx, request.query))
  );
};

export default paymentRoutes;
