import type { Knex } from "knex";

const TYPES = ["purchased", "to_rider", "to_customer", "collected", "returned", "damaged", "lost", "retired"];

export async function up(knex: Knex) {
  await knex.schema.alterTable("container_movements", (t) => {
    t.enu("type", [...TYPES, "filled"])
      .notNullable()
      .alter();
  });
}

export async function down(knex: Knex) {
  await knex("container_movements").where({ type: "filled" }).del();

  await knex.schema.alterTable("container_movements", (t) => {
    t.enu("type", TYPES).notNullable().alter();
  });
}
