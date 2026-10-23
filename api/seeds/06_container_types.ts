import type { Knex } from "knex";

export async function seed(knex: Knex) {
  await knex("container_types").del();

  await knex("container_types").insert([
    { code: "round", deliverable: true, deposit_amount: 20000 },
    { code: "slim", deliverable: false, deposit_amount: 15000 },
  ]);
}
