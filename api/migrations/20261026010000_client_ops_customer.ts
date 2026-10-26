import type { Knex } from "knex";

export async function up(knex: Knex) {
  await knex.schema.alterTable("client_ops", (t) => {
    t.uuid("customer_id").nullable().index();
  });
}

export async function down(knex: Knex) {
  await knex.schema.alterTable("client_ops", (t) => {
    t.dropIndex("customer_id");
    t.dropColumn("customer_id");
  });
}
