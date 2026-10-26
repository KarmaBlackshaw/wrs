import type { Knex } from "knex";
import { ID_GROUP, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("expense_categories").del();

  await knex("expense_categories").insert(
    ["Consumables", "Electricity", "Water supply", "Fuel", "Repairs", "Payroll", "Loans and advances", "Rent", "Other"].map((name, i) => ({
      id: id(ID_GROUP.expenseCategory, i + 1),
      name,
      created_at,
    }))
  );
}
