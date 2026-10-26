import { maintenanceItemSchema, maintenanceLogBodySchema } from "@wrs/contract/maintenance";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { listMaintenance, logReplacement } from "../domain/maintenance.ts";
import { withTx } from "../lib/context/withTx.ts";

const maintenanceRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/maintenance", { config: { roles: ["owner"] }, schema: { response: { 200: z.array(maintenanceItemSchema) } } }, (request) =>
    withTx(request, (ctx) => listMaintenance(ctx))
  );

  app.post(
    "/maintenance-logs",
    { config: { roles: ["owner"] }, schema: { body: maintenanceLogBodySchema, response: { 200: maintenanceItemSchema } } },
    (request) => withTx(request, (ctx) => logReplacement(ctx, request.body))
  );
};

export default maintenanceRoutes;
