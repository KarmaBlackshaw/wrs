import type { Knex } from "knex";
import { EMPLOYEE, ID_GROUP, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();
  const rider = { frequency: "daily", rate_basis: "per_day", base_rate: 55000, quota: 100, incentive_per_container: 500 };
  const salaried = { frequency: "semi_monthly", rate_basis: "per_period" };

  await knex("pay_plans").insert(
    [
      { employee_id: EMPLOYEE.owner, ...salaried, base_rate: 1500000, rest_weekday: null },
      { employee_id: EMPLOYEE.cashier, ...salaried, base_rate: 45000 },
      { employee_id: EMPLOYEE.rider1, ...rider },
      { employee_id: EMPLOYEE.rider2, ...rider },
      { employee_id: EMPLOYEE.washer, ...salaried, base_rate: 40000 },
      { employee_id: EMPLOYEE.helper, ...salaried, base_rate: 38000 },
      { employee_id: EMPLOYEE.multi, ...rider, effective_from: "2026-06-15" },
    ].map((p, i) => ({ id: id(ID_GROUP.payPlan, i + 1), rest_weekday: 0, effective_from: "2026-01-01", ...p, created_at }))
  );
}
