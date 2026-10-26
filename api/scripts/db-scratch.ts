import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_NAME, DB_ROOT_PASSWORD = "" } = process.env;
const [name, ...flags] = process.argv.slice(2);
const isSeed = flags.includes("--seed");
const isInitOnly = flags.includes("--init-only");

if (name == null || !/^wrs_scratch_\w+$/.test(name) || name === DB_NAME) {
  process.stderr.write("Usage: npm run db:scratch -- wrs_scratch_<name> [--seed] [--init-only]\n");
  process.exit(1);
}

const connection = await mysql.createConnection({ host: DB_HOST, port: Number(DB_PORT ?? 3306), user: "root", password: DB_ROOT_PASSWORD });

await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
await connection.query(`CREATE DATABASE \`${name}\``);
await connection.end();

const knexCli = fileURLToPath(import.meta.resolve("knex/bin/cli.js"));
const knexEnv = { ...process.env, DB_NAME: name, DB_USER: "root", DB_PASSWORD: DB_ROOT_PASSWORD };

const runKnex = (args: string[]) => {
  const { status } = spawnSync(process.execPath, [knexCli, ...args], { stdio: "inherit", env: knexEnv });

  if (status !== 0) {
    process.exit(status ?? 1);
  }
};

runKnex(isInitOnly ? ["migrate:up", "20260927000000_init.ts"] : ["migrate:latest"]);

if (isSeed) {
  runKnex(["seed:run"]);
}

process.stdout.write(`\nScratch database ready. Reuse it with:\nDB_NAME=${name} DB_USER=root DB_PASSWORD=${DB_ROOT_PASSWORD}\n`);
