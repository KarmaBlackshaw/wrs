import type { Knex } from "knex";

const ROLES = ["owner", "cashier", "rider", "washer", "helper"];
const PAYMENT_TYPES = ["cash", "e_wallet", "credit"];
const PAY_FREQUENCIES = ["daily", "weekly", "semi_monthly", "monthly"];
const LOCATIONS = ["station", "rider", "customer", "external"];
const OWNERSHIP_EVENTS = ["created", "claimed_by_delivery", "released", "released_early", "reassigned"];

const TABLES = [
  "settings",
  "employees",
  "employee_roles",
  "pay_plans",
  "customers",
  "customer_ownerships",
  "container_types",
  "products",
  "prices",
  "drawer_sessions",
  "trips",
  "trip_lines",
  "deliveries",
  "walk_in_sales",
  "walk_in_sale_lines",
  "payments",
  "deposit_entries",
  "container_movements",
  "container_counts",
  "shortages",
  "consumables",
  "product_usages",
  "stock_entries",
  "meter_readings",
  "maintenance_logs",
  "water_readings",
  "lab_tests",
  "expense_categories",
  "expenses",
  "pay_runs",
  "pay_lines",
  "loans",
  "installments",
  "voids",
];

export async function up(knex: Knex) {
  // ponytail: `updated_at` doubles as the pull cursor for sync (section 11); swap for a per-table sequence if clock skew bites.
  const record = (t: Knex.CreateTableBuilder) => {
    t.uuid("id").primary();
    t.datetime("created_at", { precision: 3 }).notNullable();
    t.timestamp("updated_at", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)")).index();
  };

  const employee = (t: Knex.CreateTableBuilder, column: string, nullable = false) => {
    const col = t.uuid(column).references("employees.id");

    return nullable ? col.nullable() : col.notNullable();
  };

  await knex.schema.createTable("settings", (t) => {
    t.string("key", 64);
    t.json("value").notNullable();
    t.datetime("effective_from", { precision: 3 }).notNullable();
    t.primary(["key", "effective_from"]);
  });

  await knex.schema.createTable("employees", (t) => {
    record(t);
    t.string("username", 64).notNullable().unique();
    t.string("password_hash").notNullable();
    t.string("name").notNullable();
    t.string("phone", 32).nullable();
    t.boolean("active").notNullable().defaultTo(true);
  });

  await knex.schema.createTable("employee_roles", (t) => {
    employee(t, "employee_id").onDelete("CASCADE");
    t.enu("role", ROLES).notNullable();
    t.primary(["employee_id", "role"]);
  });

  await knex.schema.createTable("pay_plans", (t) => {
    record(t);
    employee(t, "employee_id");
    t.enu("frequency", PAY_FREQUENCIES).notNullable();
    t.enu("rate_basis", ["per_day", "per_period"]).notNullable();
    t.integer("base_rate").notNullable();
    t.integer("quota").nullable();
    t.integer("incentive_per_container").nullable();
    t.decimal("deduction_cap_pct", 5, 2).nullable();
    t.date("effective_from").notNullable();
    t.date("effective_to").nullable();
  });

  await knex.schema.createTable("customers", (t) => {
    record(t);
    t.string("first_name").notNullable();
    t.string("last_name").notNullable();
    t.string("phone", 32).notNullable().unique();
    t.text("address").notNullable();
    employee(t, "rider_id", true).index();
    t.enu("status", ["pending", "active"]).notNullable().defaultTo("active");
    t.smallint("delivery_interval_days").unsigned().nullable();
    t.boolean("credit_enabled").notNullable().defaultTo(false);
    t.integer("credit_limit").nullable();
    t.boolean("deposit_waived").notNullable().defaultTo(false);
    t.index(["last_name", "first_name"]);
  });

  await knex.schema.createTable("customer_ownerships", (t) => {
    record(t);
    t.uuid("customer_id").notNullable().references("customers.id");
    employee(t, "rider_id", true);
    t.enu("event", OWNERSHIP_EVENTS).notNullable();
    employee(t, "by_employee_id");
  });

  await knex.schema.createTable("container_types", (t) => {
    t.string("code", 16).primary();
    t.boolean("deliverable").notNullable();
    t.integer("deposit_amount").notNullable();
  });

  await knex.schema.createTable("products", (t) => {
    record(t);
    t.string("name").notNullable();
    t.enu("kind", ["refill", "container", "bottled", "other"]).notNullable();
    t.string("container_type", 16).nullable().references("container_types.code");
    t.boolean("active").notNullable().defaultTo(true);
  });

  await knex.schema.createTable("prices", (t) => {
    t.uuid("product_id").notNullable().references("products.id");
    t.integer("amount").notNullable();
    t.datetime("effective_from", { precision: 3 }).notNullable();
    t.primary(["product_id", "effective_from"]);
  });

  await knex.schema.createTable("drawer_sessions", (t) => {
    record(t);
    employee(t, "cashier_id");
    t.datetime("opened_at", { precision: 3 }).notNullable();
    t.integer("opening_cash").notNullable();
    t.datetime("closed_at", { precision: 3 }).nullable();
    t.integer("counted_cash").nullable();
  });

  await knex.schema.createTable("trips", (t) => {
    record(t);
    employee(t, "rider_id");
    employee(t, "created_by");
    t.enu("status", ["open", "returned", "reconciled"]).notNullable().defaultTo("open");
    t.datetime("loaded_at", { precision: 3 }).notNullable();
    t.datetime("returned_at", { precision: 3 }).nullable();
    t.integer("cash_remitted").nullable();
    employee(t, "reconciled_by", true);
    t.datetime("reconciled_at", { precision: 3 }).nullable();
  });

  await knex.schema.createTable("trip_lines", (t) => {
    t.uuid("trip_id").notNullable().references("trips.id");
    t.uuid("product_id").notNullable().references("products.id");
    t.integer("loaded").notNullable();
    t.integer("returned_full").nullable();
    t.integer("returned_empty").nullable();
    t.primary(["trip_id", "product_id"]);
  });

  await knex.schema.createTable("deliveries", (t) => {
    record(t);
    t.uuid("trip_id").notNullable().references("trips.id");
    t.uuid("customer_id").notNullable().references("customers.id");
    t.uuid("product_id").notNullable().references("products.id");
    t.integer("delivered").notNullable();
    t.integer("empties_collected").notNullable();
    t.integer("amount").notNullable();
    t.enu("payment_type", PAYMENT_TYPES).notNullable();
    t.integer("deposit_collected").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("walk_in_sales", (t) => {
    record(t);
    t.uuid("drawer_session_id").notNullable().references("drawer_sessions.id");
    t.uuid("customer_id").nullable().references("customers.id");
    t.integer("amount").notNullable();
    t.enu("payment_type", PAYMENT_TYPES).notNullable();
    t.integer("deposit_collected").notNullable().defaultTo(0);
  });

  await knex.schema.createTable("walk_in_sale_lines", (t) => {
    t.uuid("sale_id").notNullable().references("walk_in_sales.id");
    t.uuid("product_id").notNullable().references("products.id");
    t.integer("qty").notNullable();
    t.integer("unit_price").notNullable();
    t.integer("borrowed").notNullable().defaultTo(0);
    t.integer("returned").notNullable().defaultTo(0);
    t.primary(["sale_id", "product_id"]);
  });

  await knex.schema.createTable("payments", (t) => {
    record(t);
    t.uuid("customer_id").notNullable().references("customers.id");
    t.integer("amount").notNullable();
    employee(t, "collected_by");
    t.enu("source", ["trip", "drawer"]).notNullable();
    t.uuid("trip_id").nullable().references("trips.id");
    t.uuid("drawer_session_id").nullable().references("drawer_sessions.id");
  });

  await knex.schema.createTable("deposit_entries", (t) => {
    record(t);
    t.uuid("customer_id").notNullable().references("customers.id");
    t.string("container_type", 16).notNullable().references("container_types.code");
    t.integer("qty").notNullable();
    t.integer("amount").notNullable();
    t.enu("kind", ["collected", "refunded", "forfeited", "waived"]).notNullable();
    employee(t, "created_by");
  });

  await knex.schema.createTable("container_movements", (t) => {
    record(t);
    t.enu("type", ["purchased", "to_rider", "to_customer", "collected", "returned", "damaged", "lost", "retired"]).notNullable();
    t.string("container_type", 16).notNullable().references("container_types.code");
    t.integer("qty").notNullable();
    t.boolean("full").notNullable();
    t.enu("from_location", LOCATIONS).notNullable();
    t.enu("to_location", LOCATIONS).notNullable();
    employee(t, "rider_id", true);
    t.uuid("customer_id").nullable().references("customers.id");
    t.string("reason").nullable();
    t.string("ref_type", 32).nullable();
    t.uuid("ref_id").nullable();
    employee(t, "created_by");
    t.index(["ref_type", "ref_id"]);
  });

  await knex.schema.createTable("container_counts", (t) => {
    record(t);
    t.date("date").notNullable();
    t.string("container_type", 16).notNullable().references("container_types.code");
    t.integer("full").notNullable();
    t.integer("empty").notNullable();
    t.integer("expected_full").notNullable();
    t.integer("expected_empty").notNullable();
    employee(t, "created_by");
  });

  await knex.schema.createTable("shortages", (t) => {
    record(t);
    employee(t, "employee_id");
    t.enu("source", ["trip", "drawer"]).notNullable();
    t.uuid("ref_id").notNullable();
    t.integer("cash").notNullable().defaultTo(0);
    t.integer("containers").notNullable().defaultTo(0);
    t.boolean("approved_for_deduction").notNullable().defaultTo(false);
    employee(t, "approved_by", true);
  });

  await knex.schema.createTable("consumables", (t) => {
    record(t);
    t.string("name").notNullable();
    t.string("unit", 16).notNullable();
    t.enu("kind", ["per_unit", "maintenance", "general"]).notNullable();
    t.decimal("reorder_level", 10, 3).notNullable().defaultTo(0);
    t.integer("interval_liters").nullable();
    t.integer("interval_days").nullable();
  });

  await knex.schema.createTable("product_usages", (t) => {
    t.uuid("product_id").notNullable().references("products.id");
    t.uuid("consumable_id").notNullable().references("consumables.id");
    t.decimal("qty_per_unit", 10, 3).notNullable();
    t.primary(["product_id", "consumable_id"]);
  });

  await knex.schema.createTable("stock_entries", (t) => {
    record(t);
    t.uuid("consumable_id").notNullable().references("consumables.id");
    t.decimal("qty", 10, 3).notNullable();
    t.string("reason").notNullable();
    t.uuid("ref_id").nullable();
    employee(t, "created_by");
  });

  await knex.schema.createTable("meter_readings", (t) => {
    record(t);
    t.integer("liters").unsigned().notNullable();
    t.datetime("at", { precision: 3 }).notNullable();
    employee(t, "logged_by");
  });

  await knex.schema.createTable("maintenance_logs", (t) => {
    record(t);
    t.uuid("consumable_id").notNullable().references("consumables.id");
    t.datetime("at", { precision: 3 }).notNullable();
    t.integer("meter_liters").unsigned().notNullable();
    employee(t, "logged_by");
  });

  await knex.schema.createTable("water_readings", (t) => {
    record(t);
    t.decimal("tds", 8, 2).notNullable();
    t.decimal("ph", 4, 2).nullable();
    t.datetime("at", { precision: 3 }).notNullable();
    employee(t, "logged_by");
  });

  await knex.schema.createTable("lab_tests", (t) => {
    record(t);
    t.string("type").notNullable();
    t.date("date").notNullable();
    t.string("result").notNullable();
    t.string("file_url").notNullable();
    t.date("next_due").notNullable();
    employee(t, "created_by");
  });

  await knex.schema.createTable("expense_categories", (t) => {
    record(t);
    t.string("name", 64).notNullable().unique();
    t.boolean("active").notNullable().defaultTo(true);
  });

  await knex.schema.createTable("expenses", (t) => {
    record(t);
    t.uuid("category_id").notNullable().references("expense_categories.id");
    t.integer("amount").notNullable();
    t.date("date").notNullable();
    employee(t, "paid_by");
    t.enu("source", ["drawer", "owner"]).notNullable();
    t.uuid("drawer_session_id").nullable().references("drawer_sessions.id");
    t.string("receipt_url").nullable();
    t.uuid("consumable_id").nullable().references("consumables.id");
    t.decimal("qty", 10, 3).nullable();
    t.string("ref_type", 32).nullable();
    t.uuid("ref_id").nullable();
  });

  await knex.schema.createTable("pay_runs", (t) => {
    record(t);
    t.enu("frequency", PAY_FREQUENCIES).notNullable();
    t.date("period_start").notNullable();
    t.date("period_end").notNullable();
    t.enu("status", ["draft", "finalized"]).notNullable().defaultTo("draft");
    employee(t, "finalized_by", true);
    t.datetime("finalized_at", { precision: 3 }).nullable();
  });

  await knex.schema.createTable("pay_lines", (t) => {
    t.uuid("run_id").notNullable().references("pay_runs.id");
    employee(t, "employee_id");
    t.integer("days_worked").notNullable().defaultTo(0);
    t.integer("delivered").notNullable().defaultTo(0);
    t.integer("base").notNullable();
    t.integer("incentive").notNullable().defaultTo(0);
    t.integer("adjustments").notNullable().defaultTo(0);
    t.json("deductions").notNullable();
    t.integer("net").notNullable();
    t.primary(["run_id", "employee_id"]);
  });

  await knex.schema.createTable("loans", (t) => {
    record(t);
    employee(t, "employee_id");
    t.enu("type", ["advance", "loan"]).notNullable();
    t.integer("principal").notNullable();
    t.decimal("rate_pct", 5, 2).notNullable().defaultTo(0);
    t.enu("method", ["flat", "diminishing"]).nullable();
    t.integer("term_months").nullable();
    t.string("authorization_url").nullable();
    t.enu("status", ["requested", "approved", "rejected", "released", "paid"]).notNullable().defaultTo("requested");
    employee(t, "approved_by", true);
    t.datetime("released_at", { precision: 3 }).nullable();
  });

  await knex.schema.createTable("installments", (t) => {
    t.uuid("loan_id").notNullable().references("loans.id");
    t.integer("seq").notNullable();
    t.date("due").notNullable();
    t.integer("principal_part").notNullable();
    t.integer("interest_part").notNullable();
    t.boolean("paid").notNullable().defaultTo(false);
    t.uuid("pay_run_id").nullable().references("pay_runs.id");
    t.primary(["loan_id", "seq"]);
  });

  await knex.schema.createTable("voids", (t) => {
    record(t);
    t.string("ref_type", 32).notNullable();
    t.uuid("ref_id").notNullable();
    t.string("reason").notNullable();
    employee(t, "requested_by");
    t.enu("status", ["pending", "approved", "rejected"]).notNullable();
    employee(t, "approved_by", true);
    t.datetime("decided_at", { precision: 3 }).nullable();
    t.index(["ref_type", "ref_id"]);
  });
}

export async function down(knex: Knex) {
  for (const table of TABLES.toReversed()) {
    await knex.schema.dropTableIfExists(table);
  }
}
