import { randomUUID } from "node:crypto";
import type { Knex } from "knex";
import { move } from "../src/domain/container.ts";
import { makeCtx } from "../src/lib/context/makeCtx.ts";
import { historyWindow } from "./ids/history.ts";
import { EMPLOYEE } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const { masterDataAt } = historyWindow();

  const ctx = makeCtx({
    db: knex,
    actor: { id: EMPLOYEE.owner, name: "Owner", roles: ["owner"], activeRole: "owner" },
    now: masterDataAt,
    mode: "strict",
  });

  await knex("container_movements").del();

  for (const [containerType, qty] of [
    ["round", 200],
    ["slim", 80],
  ] as const) {
    await move(ctx, {
      containerType,
      qty,
      isFull: false,
      from: { kind: "external", id: null },
      to: { kind: "station", id: null },
      type: "purchased",
      refType: "opening",
      refId: randomUUID(),
      reason: "Opening stock",
    });
  }

  await knex("container_movements").where({ ref_type: "opening" }).update({ updated_at: masterDataAt });
}
