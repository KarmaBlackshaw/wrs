import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

for (const workspace of ["api", "ui"]) {
  const envFile = `${workspace}/.env`;

  if (!existsSync(envFile)) {
    copyFileSync(`${workspace}/.env.example`, envFile);
    process.stdout.write(`Created ${envFile}\n`);
  }
}

const apiEnv = readFileSync("api/.env", "utf8");
const jwtSecret = apiEnv.match(/^JWT_SECRET=(.*)$/m)?.[1]?.trim() ?? "";

if (jwtSecret.length < 32) {
  const line = `JWT_SECRET=${randomBytes(32).toString("hex")}`;
  const hasLine = /^JWT_SECRET=.*$/m.test(apiEnv);

  writeFileSync("api/.env", hasLine ? apiEnv.replace(/^JWT_SECRET=.*$/m, line) : `${apiEnv.trimEnd()}\n${line}\n`);
  process.stdout.write("Generated JWT_SECRET in api/.env\n");
}

process.stdout.write(`
Next:
  docker compose -f api/compose.yaml up -d --wait db
  npm run migrate
  npm run seed
  npm run dev
`);
