import type { Knex } from "knex";
import { PRODUCT } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("products").del();

  await knex("products").insert(
    [
      { id: PRODUCT.roundRefill, name: "Round refill", kind: "refill", container_type: "round" },
      { id: PRODUCT.slimRefill, name: "Slim refill", kind: "refill", container_type: "slim" },
      { id: PRODUCT.roundContainer, name: "Round container (new)", kind: "container", container_type: "round" },
      { id: PRODUCT.slimContainer, name: "Slim container (new)", kind: "container", container_type: "slim" },
      { id: PRODUCT.bottled, name: "Bottled water 500 ml", kind: "bottled" },
      { id: PRODUCT.ice, name: "Ice tube (pack)", kind: "other" },
    ].map((p) => ({ ...p, created_at }))
  );
}
