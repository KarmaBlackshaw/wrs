import { syncSnapshotQuerySchema, syncSnapshotSchema } from "@wrs/contract/sync";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getSyncSnapshot } from "../domain/sync-snapshot.ts";
import { withTx } from "../lib/context/withTx.ts";

const syncSnapshotRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/sync/snapshot",
    { config: { roles: ["rider"] }, schema: { querystring: syncSnapshotQuerySchema, response: { 200: syncSnapshotSchema } } },
    (request) => withTx(request, (ctx) => getSyncSnapshot(ctx, request.query))
  );
};

export default syncSnapshotRoutes;
