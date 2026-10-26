import { pageOf } from "@wrs/contract/common";
import { depositEntrySchema, depositListQuerySchema } from "@wrs/contract/deposit";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listDeposits } from "../domain/payment.ts";
import { withTx } from "../lib/context/withTx.ts";

const depositRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/deposits",
    { config: { roles: ["owner"] }, schema: { querystring: depositListQuerySchema, response: { 200: pageOf(depositEntrySchema) } } },
    (request) => withTx(request, (ctx) => listDeposits(ctx, request.query))
  );
};

export default depositRoutes;
