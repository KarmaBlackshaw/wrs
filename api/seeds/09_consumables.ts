import type { Knex } from "knex";
import { CONSUMABLE } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("consumables").del();

  await knex("consumables").insert(
    [
      { id: CONSUMABLE.cap, name: "Cap", unit: "pc", kind: "per_unit", reorder_level: 200 },
      { id: CONSUMABLE.seal, name: "Seal", unit: "pc", kind: "per_unit", reorder_level: 200 },
      { id: CONSUMABLE.sedimentFilter, name: "Sediment filter", unit: "pc", kind: "maintenance", reorder_level: 2, interval_liters: 20000, interval_days: 30 },
      { id: CONSUMABLE.carbonFilter, name: "Carbon filter", unit: "pc", kind: "maintenance", reorder_level: 1, interval_liters: 40000, interval_days: 90 },
      { id: CONSUMABLE.roMembrane, name: "RO membrane", unit: "pc", kind: "maintenance", reorder_level: 1, interval_liters: 400000, interval_days: 730 },
      { id: CONSUMABLE.uvLamp, name: "UV lamp", unit: "pc", kind: "maintenance", reorder_level: 1, interval_days: 365 },
      { id: CONSUMABLE.sanitizer, name: "Sanitizer", unit: "L", kind: "general", reorder_level: 2 },
    ].map((c) => ({ ...c, created_at }))
  );
}
