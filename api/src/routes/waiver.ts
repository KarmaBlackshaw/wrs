import { idSchema } from "@wrs/contract/common";
import { waiverRequestCreateSchema, waiverRequestRejectBodySchema, waiverRequestSchema } from "@wrs/contract/customer";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { approveWaiver, rejectWaiver, requestWaiver } from "../domain/waiver.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const waiverRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/waiver-requests",
    { config: { roles: ["cashier"] }, schema: { body: waiverRequestCreateSchema, response: { 200: waiverRequestSchema } } },
    (request) => withTx(request, (ctx) => requestWaiver(ctx, request.body))
  );

  app.post("/waiver-requests/:id/approve", { config: { roles: ["owner"] }, schema: { params, response: { 200: waiverRequestSchema } } }, (request) =>
    withTx(request, (ctx) => approveWaiver(ctx, request.params.id))
  );

  app.post(
    "/waiver-requests/:id/reject",
    { config: { roles: ["owner"] }, schema: { params, body: waiverRequestRejectBodySchema, response: { 200: waiverRequestSchema } } },
    (request) => withTx(request, (ctx) => rejectWaiver(ctx, request.params.id, request.body))
  );
};

export default waiverRoutes;
