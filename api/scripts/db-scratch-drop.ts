import mysql from "mysql2/promise";

const { DB_HOST, DB_PORT, DB_NAME, DB_ROOT_PASSWORD = "" } = process.env;
const [name] = process.argv.slice(2);

if (name == null || !/^wrs_scratch_\w+$/.test(name) || name === DB_NAME) {
  process.stderr.write("Usage: npm run db:scratch:drop -- wrs_scratch_<name>\n");
  process.exit(1);
}

const connection = await mysql.createConnection({ host: DB_HOST, port: Number(DB_PORT ?? 3306), user: "root", password: DB_ROOT_PASSWORD });

await connection.query(`DROP DATABASE IF EXISTS \`${name}\``);
await connection.end();
process.stdout.write(`Dropped ${name}\n`);
