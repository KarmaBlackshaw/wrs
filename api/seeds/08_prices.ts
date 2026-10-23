import type { Knex } from "knex";
import { PRODUCT } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const effective_from = new Date();

  await knex("prices").del();

  await knex("prices").insert(
    [
      { product_id: PRODUCT.roundRefill, amount: 2500 },
      { product_id: PRODUCT.slimRefill, amount: 2500 },
      { product_id: PRODUCT.roundContainer, amount: 25000 },
      { product_id: PRODUCT.slimContainer, amount: 20000 },
      { product_id: PRODUCT.bottled, amount: 1500 },
      { product_id: PRODUCT.ice, amount: 3000 },
    ].map((p) => ({ ...p, effective_from }))
  );
}
