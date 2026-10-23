import argon2 from "argon2";
import type { Knex } from "knex";
import { EMPLOYEE } from "./ids/index.ts";

const DEV_PASSWORD = "wrs12345";

export async function seed(knex: Knex) {
  const created_at = new Date();
  const password_hash = await argon2.hash(DEV_PASSWORD);

  await knex("employees").del();

  await knex("employees").insert(
    [
      { id: EMPLOYEE.owner, username: "owner", name: "Maria Santos", phone: "09170000001" },
      { id: EMPLOYEE.cashier, username: "cashier", name: "Ana Reyes", phone: "09170000002" },
      { id: EMPLOYEE.rider1, username: "rider1", name: "Jun dela Cruz", phone: "09170000003" },
      { id: EMPLOYEE.rider2, username: "rider2", name: "Paolo Garcia", phone: "09170000004" },
      { id: EMPLOYEE.washer, username: "washer", name: "Lito Mendoza", phone: "09170000005" },
      { id: EMPLOYEE.multi, username: "multi", name: "Ramon Bautista", phone: "09170000006" },
    ].map((e) => ({ ...e, password_hash, created_at }))
  );
}
