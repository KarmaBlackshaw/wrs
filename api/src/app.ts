import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "./db.ts";
import { env } from "./env.ts";
import auth from "./plugins/auth.ts";
import errors from "./plugins/errors.ts";
import routes from "./routes/index.ts";

export const buildApp = async () => {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty", options: { ignore: "pid,hostname" } } } : env.NODE_ENV === "production",
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(","),
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["authorization", "x-active-role", "content-type"],
  });

  await app.register(sensible);
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } });
  await app.register(errors);
  await app.register(auth);
  await app.register(routes, { prefix: "/api" });

  app.addHook("onClose", () => db.destroy());

  return app;
};
