import type { Knex } from "knex";
import { historyWindow } from "./ids/history.ts";
import { CONSUMABLE, EMPLOYEE, ID_GROUP, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const { masterDataAt: created_at } = historyWindow();

  await knex("stock_entries").del();

  await knex("stock_entries").insert(
    [
      { consumable_id: CONSUMABLE.cap, qty: 2000 },
      { consumable_id: CONSUMABLE.seal, qty: 1400 },
      { consumable_id: CONSUMABLE.sedimentFilter, qty: 6 },
      { consumable_id: CONSUMABLE.carbonFilter, qty: 3 },
      { consumable_id: CONSUMABLE.roMembrane, qty: 3 },
      { consumable_id: CONSUMABLE.uvLamp, qty: 3 },
      { consumable_id: CONSUMABLE.sanitizer, qty: 6 },
    ].map((s, i) => ({
      id: id(ID_GROUP.stockEntry, i + 1),
      ...s,
      kind: "restock",
      reason: "Opening stock",
      created_by: EMPLOYEE.owner,
      created_at,
      updated_at: created_at,
    }))
  );
}
