import { rejectBodySchema } from "@wrs/contract/approval";
import { idSchema } from "@wrs/contract/common";
import { syncConflictSchema } from "@wrs/contract/sync";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { acceptSyncConflict, voidSyncConflict } from "../domain/sync-conflict.ts";
import { withTx } from "../lib/context/withTx.ts";

const params = z.object({ id: idSchema });

const syncConflictRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/sync-conflicts/:id/accept", { config: { roles: ["owner"] }, schema: { params, response: { 200: syncConflictSchema } } }, (request) =>
    withTx(request, (ctx) => acceptSyncConflict(ctx, request.params.id))
  );

  app.post(
    "/sync-conflicts/:id/void",
    { config: { roles: ["owner"] }, schema: { params, body: rejectBodySchema, response: { 200: syncConflictSchema } } },
    (request) => withTx(request, (ctx) => voidSyncConflict(ctx, request.params.id, request.body))
  );
};

export default syncConflictRoutes;
