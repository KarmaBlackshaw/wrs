import { z } from "zod";

export const env = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().default(3000),
    CORS_ORIGIN: z.string(),
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
  })
  .parse(process.env);
