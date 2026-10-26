import { meSchema } from "@wrs/contract/auth";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { db } from "../db.ts";
import { findMe } from "../domain/auth.ts";

const meRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/me", { schema: { response: { 200: meSchema } } }, async (request) => findMe(db, request.actor.id));
};

export default meRoutes;
