import type { Knex } from "knex";
import { EMPLOYEE, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();
  const rider = { rate_basis: "per_day", base_rate: 50000, quota: 100, incentive_per_container: 300 };

  await knex("pay_plans").del();

  await knex("pay_plans").insert(
    [
      { id: id(2, 1), employee_id: EMPLOYEE.cashier, rate_basis: "per_period", base_rate: 300000 },
      { id: id(2, 2), employee_id: EMPLOYEE.rider1, ...rider },
      { id: id(2, 3), employee_id: EMPLOYEE.rider2, ...rider },
      { id: id(2, 4), employee_id: EMPLOYEE.washer, rate_basis: "per_period", base_rate: 250000 },
      { id: id(2, 5), employee_id: EMPLOYEE.multi, ...rider },
    ].map((p) => ({ ...p, frequency: "weekly", effective_from: created_at, created_at }))
  );
}
