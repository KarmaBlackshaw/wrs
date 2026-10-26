import type { Knex } from "knex";
import { CONSUMABLE, EMPLOYEE, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("stock_entries").del();

  await knex("stock_entries").insert(
    [
      { consumable_id: CONSUMABLE.cap, qty: 600 },
      { consumable_id: CONSUMABLE.seal, qty: 600 },
      { consumable_id: CONSUMABLE.sedimentFilter, qty: 6 },
      { consumable_id: CONSUMABLE.carbonFilter, qty: 3 },
      { consumable_id: CONSUMABLE.roMembrane, qty: 3 },
      { consumable_id: CONSUMABLE.uvLamp, qty: 3 },
      { consumable_id: CONSUMABLE.sanitizer, qty: 6 },
    ].map((s, i) => ({ id: id(6, i + 1), ...s, kind: "restock", reason: "Opening stock", created_by: EMPLOYEE.owner, created_at }))
  );
}
