import type { Knex } from "knex";
import { id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("expense_categories").del();

  await knex("expense_categories").insert(
    ["Consumables", "Electricity", "Water supply", "Fuel", "Repairs", "Payroll", "Loans and advances", "Rent", "Other"].map((name, i) => ({
      id: id(8, i + 1),
      name,
      created_at,
    }))
  );
}
