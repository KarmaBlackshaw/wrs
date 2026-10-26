import { dashboardSchema } from "@wrs/contract/report";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getDashboard } from "../domain/dashboard.ts";
import { withTx } from "../lib/context/withTx.ts";

const dashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/dashboard", { config: { roles: ["owner"] }, schema: { response: { 200: dashboardSchema } } }, (request) =>
    withTx(request, (ctx) => getDashboard(ctx))
  );
};

export default dashboardRoutes;
