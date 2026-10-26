import { syncPushBodySchema, syncPushResultSchema } from "@wrs/contract/sync";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { db } from "../db.ts";
import { applyOp } from "../domain/sync-ops.ts";

const syncOpsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/sync/ops", { config: { roles: ["rider"] }, schema: { body: syncPushBodySchema, response: { 200: syncPushResultSchema } } }, async (request) => {
    const serverNow = new Date();
    const results = [];

    for (const op of request.body.ops) {
      const result = await applyOp({ db, actor: request.actor, op, serverNow });

      request.log.info({ opId: op.opId, kind: op.kind, status: result.status, codes: result.codes });
      results.push(result);
    }

    return { results };
  });
};

export default syncOpsRoutes;
