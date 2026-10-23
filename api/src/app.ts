import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "./db.ts";
import { env } from "./env.ts";
import { health } from "./routes/health.ts";

export const buildApp = async () => {
  const app = Fastify({
    logger: env.NODE_ENV === "development" ? { transport: { target: "pino-pretty", options: { ignore: "pid,hostname" } } } : env.NODE_ENV === "production",
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN.split(",") });
  await app.register(sensible);
  await app.register(health);

  app.addHook("onClose", () => db.destroy());

  return app;
};
