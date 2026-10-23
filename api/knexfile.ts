import type { Knex } from "knex";
import { env } from "./src/env.ts";

export default {
  client: "mysql2",
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    timezone: "Z",
  },
  migrations: { directory: "./migrations", extension: "ts" },
  seeds: { directory: "./seeds", extension: "ts" },
} satisfies Knex.Config;
