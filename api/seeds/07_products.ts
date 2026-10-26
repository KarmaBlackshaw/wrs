import type { Knex } from "knex";
import { historyWindow } from "./ids/history.ts";
import { PRODUCT } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const { masterDataAt: created_at } = historyWindow();

  await knex("products").del();

  await knex("products").insert(
    [
      { id: PRODUCT.roundRefill, name: "Round Container Refill", kind: "refill", container_type: "round" },
      { id: PRODUCT.slimRefill, name: "Slim Container Refill", kind: "refill", container_type: "slim" },
      { id: PRODUCT.roundContainer, name: "Round Container (new)", kind: "container", container_type: "round" },
      { id: PRODUCT.slimContainer, name: "Slim Container (new)", kind: "container", container_type: "slim" },
      { id: PRODUCT.bottled, name: "Bottled Water 500mL", kind: "bottled" },
      { id: PRODUCT.ice, name: "Ice, per bag", kind: "other" },
    ].map((p) => ({ ...p, created_at, updated_at: created_at }))
  );
}
