import argon2 from "argon2";
import type { Knex } from "knex";
import { EMPLOYEE } from "./ids/index.ts";

const DEV_PASSWORD = "wrs12345";

export async function seed(knex: Knex) {
  const created_at = new Date();
  const password_hash = await argon2.hash(DEV_PASSWORD);

  await knex("employees").insert(
    [
      { id: EMPLOYEE.owner, username: "owner", first_name: "Demo", last_name: "Owner", phone: "09171234567", hire_date: "2025-06-01" },
      { id: EMPLOYEE.cashier, username: "cashier", first_name: "Ligaya", last_name: "Santos", phone: "09182345678", hire_date: "2025-06-01" },
      { id: EMPLOYEE.rider1, username: "rider1", first_name: "Mario", last_name: "Cruz", phone: "09193456789", hire_date: "2025-06-01" },
      { id: EMPLOYEE.rider2, username: "rider2", first_name: "Ramil", last_name: "Bautista", phone: "09204567890", hire_date: "2025-08-15" },
      { id: EMPLOYEE.washer, username: "washer", first_name: "Boyet", last_name: "Reyes", phone: "09215678901", hire_date: "2025-09-01" },
      { id: EMPLOYEE.helper, username: "helper", first_name: "Fernando", last_name: "Dela Cruz", phone: "09226789012", hire_date: "2025-11-03" },
      { id: EMPLOYEE.multi, username: "multi", first_name: "Corazon", last_name: "Villanueva", phone: "09237890123", hire_date: "2026-06-15" },
    ].map((e) => ({ ...e, password_hash, created_at }))
  );
}
