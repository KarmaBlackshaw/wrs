import { loginBodySchema, loginResponseSchema } from "@wrs/contract/auth";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { db } from "../db.ts";
import { authenticate } from "../domain/auth.ts";

const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post("/auth/login", { config: { isPublic: true }, schema: { body: loginBodySchema, response: { 200: loginResponseSchema } } }, async (request) => {
    const me = await authenticate(db, request.body);

    return { token: app.jwt.sign({ sub: me.id }), me };
  });
};

export default authRoutes;
