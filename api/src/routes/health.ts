import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db.ts";

const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/health", { config: { isPublic: true }, schema: { response: { 200: z.object({ status: z.string() }) } } }, async () => {
    await db.raw("select 1");

    return { status: "ok" };
  });
};

export default healthRoutes;
