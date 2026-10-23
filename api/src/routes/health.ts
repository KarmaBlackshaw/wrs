import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { db } from "../db.ts";

export const health: FastifyPluginAsyncZod = async (app) => {
  app.get("/health", { schema: { response: { 200: z.object({ status: z.string() }) } } }, async () => {
    await db.raw("select 1");

    return { status: "ok" };
  });
};
