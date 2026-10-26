import type { Knex } from "knex";
import { CONSUMABLE, PRODUCT } from "./ids/index.ts";

export async function seed(knex: Knex) {
  await knex("product_usages").del();

  await knex("product_usages").insert([
    { product_id: PRODUCT.roundRefill, consumable_id: CONSUMABLE.cap, qty_per_unit: 1 },
    { product_id: PRODUCT.roundRefill, consumable_id: CONSUMABLE.seal, qty_per_unit: 1 },
    { product_id: PRODUCT.slimRefill, consumable_id: CONSUMABLE.cap, qty_per_unit: 1 },
    { product_id: PRODUCT.slimRefill, consumable_id: CONSUMABLE.seal, qty_per_unit: 1 },
  ]);
}
