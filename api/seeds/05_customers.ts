import type { Knex } from "knex";
import { historyWindow } from "./ids/history.ts";
import { EMPLOYEE, ID_GROUP, id } from "./ids/index.ts";

export async function seed(knex: Knex) {
  const { masterDataAt: created_at } = historyWindow();

  const customers = [
    {
      first_name: "Aling Rosa",
      last_name: "Hernandez",
      address: "12 Sampaguita St., Brgy. San Isidro, Taytay, Rizal",
      phone: "09170000001",
      rider_id: EMPLOYEE.rider1,
    },
    {
      first_name: "Mang Tomas",
      last_name: "Villaruel",
      address: "45 Mabini St., Brgy. Poblacion, Cainta, Rizal",
      phone: "09170000002",
      rider_id: EMPLOYEE.rider2,
      credit_enabled: true,
      credit_limit: 200000,
    },
    {
      first_name: "Nenita",
      last_name: "Ocampo",
      address: "78 Ilang-Ilang St., Brgy. Dolores, Taytay, Rizal",
      phone: "09170000003",
      rider_id: EMPLOYEE.multi,
      deposit_waived: true,
    },
    {
      first_name: "Renato",
      last_name: "Gonzales",
      address: "23 Kalachuchi St., Brgy. Muzon, San Mateo, Rizal",
      phone: "09170000004",
      rider_id: EMPLOYEE.owner,
      credit_enabled: true,
      credit_limit: 150000,
    },
    { first_name: "Estrella", last_name: "Manalo", address: "9 Rizal Ave., Brgy. San Juan, Taytay, Rizal", phone: "09170000005", rider_id: EMPLOYEE.rider1 },
    {
      first_name: "Bienvenido",
      last_name: "Torres",
      address: "56 Bonifacio St., Brgy. Santa Ana, Taytay, Rizal",
      phone: "09170000006",
      rider_id: EMPLOYEE.rider2,
      credit_enabled: true,
      credit_limit: 100000,
    },
    { first_name: "Corazon", last_name: "Ferrer", address: "3 Molave St., Brgy. Dolores, Taytay, Rizal", phone: "09170000007", rider_id: EMPLOYEE.multi },
    {
      first_name: "Danilo",
      last_name: "Aquino",
      address: "88 Narra St., Brgy. Muzon, San Mateo, Rizal",
      phone: "09170000008",
      rider_id: EMPLOYEE.owner,
      credit_enabled: true,
      credit_limit: 250000,
      deposit_waived: true,
    },
    { first_name: "Perlita", last_name: "Magsino", address: "14 Acacia St., Brgy. Poblacion, Cainta, Rizal", phone: "09170000009", rider_id: EMPLOYEE.rider1 },
    {
      first_name: "Armando",
      last_name: "Salvador",
      address: "31 Yakal St., Brgy. San Isidro, Taytay, Rizal",
      phone: "09170000010",
      rider_id: EMPLOYEE.rider2,
      credit_enabled: true,
      credit_limit: 120000,
    },
    { first_name: "Josefina", last_name: "Ramos", address: "67 Katmon St., Brgy. Santa Ana, Taytay, Rizal", phone: "09170000011", rider_id: EMPLOYEE.multi },
    {
      first_name: "Eduardo",
      last_name: "Mercado",
      address: "5 Waling-Waling St., Brgy. Dolores, Taytay, Rizal",
      phone: "09170000012",
      credit_enabled: true,
      credit_limit: 100000,
    },
    { first_name: "Marilou", last_name: "Espino", address: "21 Camia St., Brgy. Muzon, San Mateo, Rizal", phone: "09170000013", deposit_waived: true },
    {
      first_name: "Rogelio",
      last_name: "Pascual",
      address: "40 Anahaw St., Brgy. San Juan, Taytay, Rizal",
      phone: "09170000014",
      credit_enabled: true,
      credit_limit: 200000,
    },
    { first_name: "Teresita", last_name: "Navarro", address: "17 Adelfa St., Brgy. Poblacion, Cainta, Rizal", phone: "09170000015" },
  ].map((customer, i) => ({ id: id(ID_GROUP.customer, i + 1), rider_id: null, ...customer, created_at, updated_at: created_at }));

  await knex("customers").insert(customers);

  await knex("customer_ownerships").insert(
    customers.map((customer, i) => ({
      id: id(ID_GROUP.customerOwnership, i + 1),
      customer_id: customer.id,
      rider_id: customer.rider_id,
      event: "created",
      by_employee_id: EMPLOYEE.owner,
      created_at,
      updated_at: created_at,
    }))
  );
}
