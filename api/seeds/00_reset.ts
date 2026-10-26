import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { Knex } from "knex";
import { env } from "../src/env.ts";

export async function seed(knex: Knex) {
  const files: { id: string }[] = await knex("files").select("id");

  for (const { id } of files) {
    await rm(join(env.UPLOAD_DIR, id), { force: true });
  }

  const tables: { name: string }[] = await knex("information_schema.tables")
    .select("table_name as name")
    .where("table_schema", knex.raw("DATABASE()"))
    .andWhereNot("table_name", "like", "knex_migrations%");

  await knex.transaction(async (trx) => {
    await trx.raw("SET FOREIGN_KEY_CHECKS = 0");

    for (const { name } of tables) {
      await trx(name).del();
    }

    await trx.raw("SET FOREIGN_KEY_CHECKS = 1");
  });
}
