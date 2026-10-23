import type { Knex } from "knex";
import { manilaDayBounds } from "../src/lib/dates/manilaDayBounds.ts";
import { PRODUCT } from "./ids/index.ts";

export async function seed(knex: Knex) {
  await knex("prices").del();

  await knex("prices").insert(
    [
      { product_id: PRODUCT.roundRefill, amount: 3000, effective_from: "2025-06-01" },
      { product_id: PRODUCT.roundRefill, amount: 3500, effective_from: "2026-01-01" },
      { product_id: PRODUCT.slimRefill, amount: 2500, effective_from: "2025-06-01" },
      { product_id: PRODUCT.slimRefill, amount: 3000, effective_from: "2026-01-01" },
      { product_id: PRODUCT.roundContainer, amount: 25000, effective_from: "2025-06-01" },
      { product_id: PRODUCT.slimContainer, amount: 18000, effective_from: "2025-06-01" },
      { product_id: PRODUCT.bottled, amount: 1500, effective_from: "2025-06-01" },
      { product_id: PRODUCT.ice, amount: 5000, effective_from: "2025-06-01" },
    ].map((p) => ({ ...p, effective_from: manilaDayBounds(p.effective_from).start }))
  );
}
