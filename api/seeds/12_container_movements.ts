import type { Knex } from "knex";
import { EMPLOYEE, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  const opening = {
    type: "purchased",
    full: false,
    from_location: "external",
    to_location: "station",
    reason: "Opening stock",
    created_by: EMPLOYEE.owner,
    created_at,
  };

  await knex("container_movements").del();

  await knex("container_movements").insert([
    { id: id(7, 1), container_type: "round", qty: 200, ...opening },
    { id: id(7, 2), container_type: "slim", qty: 80, ...opening },
  ]);
}
