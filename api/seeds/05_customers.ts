import type { Knex } from "knex";
import { EMPLOYEE, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const created_at = new Date();

  await knex("customer_ownerships").del();
  await knex("customers").del();

  const customers = [
    {
      first_name: "Aling Nena",
      last_name: "Store",
      phone: "09181000001",
      address: "Purok 3, near the basketball court, Brgy. San Isidro",
      rider_id: EMPLOYEE.rider1,
      delivery_interval_days: 2,
      credit_enabled: true,
      credit_limit: 100000,
    },
    {
      first_name: "Antonio",
      last_name: "Villanueva",
      phone: "09181000002",
      address: "Blk 5 Lot 12, Villa Verde Subd., green gate",
      rider_id: EMPLOYEE.rider1,
      delivery_interval_days: 7,
    },
    {
      first_name: "Liza",
      last_name: "Cruz",
      phone: "09181000003",
      address: "123 Rizal St., beside Mercury Drug",
      rider_id: EMPLOYEE.rider2,
      delivery_interval_days: 5,
      credit_enabled: true,
      credit_limit: 50000,
    },
    {
      first_name: "St. Jude",
      last_name: "Clinic",
      phone: "09181000004",
      address: "2F Dimasalang Bldg., Mabini Ave.",
      rider_id: EMPLOYEE.rider2,
      delivery_interval_days: 3,
      credit_enabled: true,
      credit_limit: 300000,
      deposit_waived: true,
    },
    { first_name: "Joy", last_name: "Ramos", phone: "09181000005", address: "Public market, stall 14" },
    {
      first_name: "Carmen",
      last_name: "Lopez",
      phone: "09181000006",
      address: "Sitio Malinis, last house before the chapel",
      rider_id: EMPLOYEE.rider1,
      status: "pending",
      delivery_interval_days: 7,
    },
    {
      first_name: "Brgy. Hall",
      last_name: "San Isidro",
      phone: "09181000007",
      address: "Brgy. San Isidro Hall, Poblacion",
      credit_enabled: true,
      credit_limit: 200000,
      deposit_waived: true,
    },
    { first_name: "Rosa", last_name: "Dela Rosa", phone: "09181000008", address: "45 Bonifacio St., blue 3-storey", status: "pending" },
  ].map((c, i) => ({ id: id(3, i + 1), ...c, created_at }));

  await knex("customers").insert(customers);

  // ponytail: one `created` row per customer; seeds skip claim/release history.
  await knex("customer_ownerships").insert(
    customers.map((c, i) => ({
      id: id(14, i + 1),
      customer_id: c.id,
      rider_id: c.rider_id ?? null,
      event: "created",
      by_employee_id: c.rider_id ?? (c.status === "pending" ? EMPLOYEE.cashier : EMPLOYEE.owner),
      created_at,
    }))
  );
}
