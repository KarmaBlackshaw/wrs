import { pageOf } from "@wrs/contract/common";
import { drawerCloseBodySchema, drawerCurrentSchema, drawerOpenBodySchema, drawerSessionListQuerySchema, drawerSessionSchema } from "@wrs/contract/drawer";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { closeDrawer, openDrawer } from "../domain/drawer.ts";
import { currentDrawer, listDrawerSessions } from "../domain/drawer-session.ts";
import { withTx } from "../lib/context/withTx.ts";

const drawerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/drawer-sessions/current", { config: { roles: ["cashier"] }, schema: { response: { 200: drawerCurrentSchema } } }, (request) =>
    withTx(request, (ctx) => currentDrawer(ctx))
  );

  app.post("/drawer-sessions", { config: { roles: ["cashier"] }, schema: { body: drawerOpenBodySchema, response: { 200: drawerSessionSchema } } }, (request) =>
    withTx(request, (ctx) => openDrawer(ctx, request.body))
  );

  app.post(
    "/drawer-sessions/current/close",
    { config: { roles: ["cashier"] }, schema: { body: drawerCloseBodySchema, response: { 200: drawerSessionSchema } } },
    (request) => withTx(request, (ctx) => closeDrawer(ctx, request.body))
  );

  app.get(
    "/drawer-sessions",
    { config: { roles: ["owner"] }, schema: { querystring: drawerSessionListQuerySchema, response: { 200: pageOf(drawerSessionSchema) } } },
    (request) => withTx(request, (ctx) => listDrawerSessions(ctx, request.query))
  );
};

export default drawerRoutes;
