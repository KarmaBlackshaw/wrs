import { approvalListQuerySchema, approvalSchema } from "@wrs/contract/approval";
import { pageOf } from "@wrs/contract/common";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { listApprovals } from "../domain/approval.ts";
import { withTx } from "../lib/context/withTx.ts";

const approvalRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/approvals",
    { config: { roles: ["owner"] }, schema: { querystring: approvalListQuerySchema, response: { 200: pageOf(approvalSchema) } } },
    (request) => withTx(request, (ctx) => listApprovals(ctx, request.query))
  );
};

export default approvalRoutes;
