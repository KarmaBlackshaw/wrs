import { rejectBodySchema } from "@wrs/contract/approval";
import { idSchema } from "@wrs/contract/common";
import { voidBodySchema, voidSchema } from "@wrs/contract/void";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { applyVoid, rejectVoid, requestVoid } from "../domain/void.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const voidRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/voids", { config: { roles: ["cashier", "owner"] }, schema: { body: voidBodySchema, response: { 200: voidSchema } } }, (request) =>
    withTx(request, (ctx) => requestVoid(ctx, request.body))
  );

  app.post("/voids/:id/approve", { config: { roles: ["owner"] }, schema: { params, response: { 200: voidSchema } } }, (request) =>
    withTx(request, (ctx) => applyVoid(ctx, { voidId: request.params.id }))
  );

  app.post("/voids/:id/reject", { config: { roles: ["owner"] }, schema: { params, body: rejectBodySchema, response: { 200: voidSchema } } }, (request) =>
    withTx(request, (ctx) => rejectVoid(ctx, request.params.id, request.body))
  );
};

export default voidRoutes;
