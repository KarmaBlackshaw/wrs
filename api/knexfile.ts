import type { Knex } from "knex";
import type { TypeCast } from "mysql2";
import { env } from "./src/env.ts";

const toSnake = (value: string) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const toCamel = (value: string) => value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
};

const toWireValue = (value: unknown) => (value instanceof Date ? value.toISOString() : value);

const toCamelRow = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [toCamel(key), toWireValue(value)]));

const postProcess = (result: unknown): unknown => {
  if (Array.isArray(result)) {
    return result.map(postProcess);
  }

  return isPlainObject(result) ? toCamelRow(result) : result;
};

const typeCast: TypeCast = (field, next) => {
  if (field.type === "TINY" && field.length === 1) {
    const value = field.string();

    return value == null ? null : value === "1";
  }

  if (field.type === "DATE") {
    return field.string();
  }

  return next();
};

export default {
  client: "mysql2",
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    timezone: "Z",
    decimalNumbers: true,
    typeCast,
  },
  wrapIdentifier: (value, origImpl) => origImpl(value === "*" ? value : toSnake(value)),
  postProcessResponse: postProcess,
  migrations: { directory: "./migrations", extension: "ts" },
  seeds: { directory: "./seeds", extension: "ts" },
} satisfies Knex.Config;
