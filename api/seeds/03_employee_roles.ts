import type { Knex } from "knex";
import { EMPLOYEE } from "./ids/index.ts";

export async function seed(knex: Knex) {
  await knex("employee_roles").insert([
    { employee_id: EMPLOYEE.owner, role: "owner" },
    { employee_id: EMPLOYEE.owner, role: "cashier" },
    { employee_id: EMPLOYEE.owner, role: "rider" },
    { employee_id: EMPLOYEE.owner, role: "washer" },
    { employee_id: EMPLOYEE.owner, role: "helper" },
    { employee_id: EMPLOYEE.cashier, role: "cashier" },
    { employee_id: EMPLOYEE.rider1, role: "rider" },
    { employee_id: EMPLOYEE.rider2, role: "rider" },
    { employee_id: EMPLOYEE.washer, role: "washer" },
    { employee_id: EMPLOYEE.helper, role: "helper" },
    { employee_id: EMPLOYEE.multi, role: "cashier" },
    { employee_id: EMPLOYEE.multi, role: "rider" },
  ]);
}
