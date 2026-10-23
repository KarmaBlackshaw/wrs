import type { Knex } from "knex";

export async function seed(knex: Knex) {
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
