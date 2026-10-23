import type { Knex } from "knex";

const PAYMENT_METHODS = ["cash", "e_wallet"];
const TRIP_STATUSES = ["open", "returning", "returned", "reconciled"];
const INIT_TRIP_STATUSES = ["open", "returned", "reconciled"];
const OWNERSHIP_EVENTS = ["created", "claimed_by_delivery", "released", "released_early", "reassigned", "assigned"];
const INIT_OWNERSHIP_EVENTS = ["created", "claimed_by_delivery", "released", "released_early", "reassigned"];
const STOCK_KINDS = ["restock", "stock_take", "usage", "maintenance", "void", "expense_reversal"];

const NEW_TABLES = [
  "files",
  "approval_requests",
  "absences",
  "coverage_assignments",
  "pay_line_adjustments",
  "client_ops",
  "sync_conflicts",
  "void_refunds",
  "delivery_lines",
];

const employee = (t: Knex.TableBuilder, column: string, nullable = false) => {
  const col = t.uuid(column).references("employees.id");

  return nullable ? col.nullable() : col.notNullable();
};

const dropReferences = (t: Knex.TableBuilder, columns: string[]) => {
  for (const column of columns) {
    t.dropForeign([column]);
  }

  t.dropColumns(...columns);
};

export async function up(knex: Knex) {
  const record = (t: Knex.CreateTableBuilder) => {
    t.uuid("id").primary();
    t.datetime("created_at", { precision: 3 }).notNullable();
    t.timestamp("updated_at", { precision: 3 }).notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)")).index();
  };

  await knex.schema.createTable("files", (t) => {
    record(t);
    t.string("original_name").notNullable();
    t.string("mime", 100).notNullable();
    t.integer("size").unsigned().notNullable();
    employee(t, "uploaded_by");
  });

  await knex.schema.createTable("approval_requests", (t) => {
    record(t);
    t.enu("kind", ["waiver"]).notNullable();
    t.uuid("customer_id").notNullable().references("customers.id");
    employee(t, "requested_by");
    t.enu("status", ["pending", "approved", "rejected"]).notNullable().defaultTo("pending");
    t.string("decision_reason").nullable();
    employee(t, "decided_by", true);
    t.datetime("decided_at", { precision: 3 }).nullable();
  });

  await knex.schema.createTable("absences", (t) => {
    record(t);
    employee(t, "employee_id");
    t.date("from").notNullable();
    t.date("to").notNullable();
    employee(t, "created_by");
    t.index(["employee_id", "from"]);
  });

  await knex.schema.createTable("coverage_assignments", (t) => {
    t.uuid("absence_id").notNullable().references("absences.id").onDelete("CASCADE");
    t.uuid("customer_id").notNullable().references("customers.id");
    employee(t, "covering_rider_id");
    t.primary(["absence_id", "customer_id"]);
  });

  await knex.schema.createTable("pay_line_adjustments", (t) => {
    record(t);
    t.uuid("run_id").notNullable().references("pay_runs.id");
    employee(t, "employee_id");
    t.integer("amount").notNullable();
    t.string("reason").notNullable();
    employee(t, "created_by");
  });

  await knex.schema.createTable("client_ops", (t) => {
    record(t);
    employee(t, "employee_id");
    t.string("kind", 32).notNullable();
    t.enu("status", ["applied", "conflict"]).notNullable();
    t.string("ref_type", 32).nullable();
    t.uuid("ref_id").nullable();
  });

  await knex.schema.createTable("sync_conflicts", (t) => {
    record(t);
    t.uuid("client_op_id").notNullable().references("client_ops.id");
    employee(t, "employee_id");
    t.string("op_kind", 32).notNullable();
    t.json("codes").notNullable();
    t.json("payload").notNullable();
    t.string("ref_type", 32).nullable();
    t.uuid("ref_id").nullable();
    t.enu("status", ["pending", "accepted", "voided"]).notNullable().defaultTo("pending");
    employee(t, "decided_by", true);
    t.datetime("decided_at", { precision: 3 }).nullable();
    t.string("decision_reason").nullable();
  });

  await knex.schema.createTable("void_refunds", (t) => {
    record(t);
    t.uuid("void_id").notNullable().references("voids.id");
    t.integer("amount").notNullable();
    t.enu("method", PAYMENT_METHODS).notNullable();
    t.uuid("drawer_session_id").nullable().references("drawer_sessions.id");
    employee(t, "created_by");
  });

  await knex.schema.createTable("delivery_lines", (t) => {
    t.uuid("delivery_id").notNullable().references("deliveries.id").onDelete("CASCADE");
    t.uuid("product_id").notNullable().references("products.id");
    t.integer("qty").notNullable();
    t.integer("unit_price").notNullable();
    t.integer("empties_collected").notNullable().defaultTo(0);
    t.primary(["delivery_id", "product_id"]);
  });

  await knex.schema.alterTable("employees", (t) => {
    t.date("hire_date").nullable();
    t.string("first_name").nullable();
    t.string("last_name").nullable();
  });

  await knex.raw(`
    UPDATE employees SET
      hire_date = DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')),
      first_name = IF(LOCATE(' ', name) = 0, name, LEFT(name, CHAR_LENGTH(name) - CHAR_LENGTH(SUBSTRING_INDEX(name, ' ', -1)) - 1)),
      last_name = IF(LOCATE(' ', name) = 0, '', SUBSTRING_INDEX(name, ' ', -1))
  `);

  await knex.schema.alterTable("employees", (t) => {
    t.date("hire_date").notNullable().alter();
    t.string("first_name").notNullable().alter();
    t.string("last_name").notNullable().alter();
    t.dropColumn("name");
    t.index(["last_name", "first_name"]);
  });

  await knex.schema.alterTable("pay_plans", (t) => {
    t.tinyint("rest_weekday").unsigned().nullable();
    t.smallint("pto_days_override").nullable();
    t.integer("max_loan_amount_override").nullable();
  });

  await knex.schema.alterTable("pay_lines", (t) => {
    t.integer("days_worked_override").nullable();
    t.smallint("paid_leave_days").notNullable().defaultTo(0);
    t.smallint("unpaid_leave_days").notNullable().defaultTo(0);
    t.integer("credit_held").notNullable().defaultTo(0);
    t.integer("credit_recovered").notNullable().defaultTo(0);
    t.integer("carried_over").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("payments", (t) => {
    t.enu("method", PAYMENT_METHODS).notNullable().defaultTo("cash");
    t.datetime("voided_at", { precision: 3 }).nullable();
  });

  await knex.schema.alterTable("trips", (t) => {
    t.enu("status", TRIP_STATUSES).notNullable().defaultTo("open").alter();
    t.datetime("ended_at", { precision: 3 }).nullable();
    employee(t, "received_by", true);
    t.uuid("received_drawer_session_id").nullable().references("drawer_sessions.id");
  });

  await knex.schema.alterTable("deliveries", (t) => {
    t.dropForeign(["product_id"]);
    t.dropColumns("product_id", "delivered", "empties_collected", "deposit_collected");
    t.datetime("voided_at", { precision: 3 }).nullable();
    t.index(["customer_id", "created_at"]);
    t.index(["trip_id", "customer_id"]);
  });

  await knex.schema.alterTable("walk_in_sales", (t) => {
    t.dropColumn("deposit_collected");
    t.datetime("voided_at", { precision: 3 }).nullable();
  });

  await knex.schema.alterTable("deposit_entries", (t) => {
    t.enu("method", PAYMENT_METHODS).nullable();
    t.uuid("trip_id").nullable().references("trips.id");
    t.uuid("drawer_session_id").nullable().references("drawer_sessions.id");
    t.string("ref_type", 32).nullable();
    t.uuid("ref_id").nullable();
    t.index(["ref_type", "ref_id"]);
  });

  await knex.schema.alterTable("customer_ownerships", (t) => {
    t.enu("event", OWNERSHIP_EVENTS).notNullable().alter();
  });

  await knex.schema.alterTable("container_counts", (t) => {
    t.unique(["date", "container_type"]);
  });

  await knex.schema.alterTable("shortages", (t) => {
    t.dropForeign(["approved_by"]);
    t.dropColumns("approved_for_deduction", "approved_by");
    t.uuid("excluded_run_id").nullable().references("pay_runs.id");
    t.string("exclusion_reason").nullable();
    t.uuid("deducted_run_id").nullable().references("pay_runs.id");
    t.datetime("dismissed_at", { precision: 3 }).nullable();
    t.string("dismiss_reason").nullable();
    employee(t, "dismissed_by", true);
  });

  await knex.schema.alterTable("stock_entries", (t) => {
    t.string("reason").nullable().alter();
    t.enu("kind", STOCK_KINDS).notNullable();
    t.string("ref_type", 32).nullable();
  });

  await knex.schema.alterTable("expenses", (t) => {
    t.dropColumn("receipt_url");
    t.uuid("receipt_file_id").nullable().references("files.id");
    t.string("note").nullable();
    t.datetime("deleted_at", { precision: 3 }).nullable();
    employee(t, "deleted_by", true);
  });

  await knex.schema.alterTable("drawer_sessions", (t) => {
    t.integer("expected_cash").nullable();
    t.integer("variance").nullable();
  });

  await knex.schema.alterTable("lab_tests", (t) => {
    t.dropColumn("file_url");
    t.uuid("file_id").notNullable().references("files.id");
  });

  await knex.schema.alterTable("loans", (t) => {
    t.dropColumn("authorization_url");
    t.uuid("authorization_file_id").nullable().references("files.id");
    t.datetime("decided_at", { precision: 3 }).nullable();
    t.string("decision_reason").nullable();
  });

  await knex.schema.alterTable("voids", (t) => {
    t.integer("amount").notNullable();
    t.string("decision_reason").nullable();
  });
}

export async function down(knex: Knex) {
  await knex.schema.alterTable("voids", (t) => {
    t.dropColumns("amount", "decision_reason");
  });

  await knex.schema.alterTable("loans", (t) => {
    dropReferences(t, ["authorization_file_id"]);
    t.dropColumns("decided_at", "decision_reason");
    t.string("authorization_url").nullable();
  });

  await knex.schema.alterTable("lab_tests", (t) => {
    dropReferences(t, ["file_id"]);
    t.string("file_url").notNullable();
  });

  await knex.schema.alterTable("drawer_sessions", (t) => {
    t.dropColumns("expected_cash", "variance");
  });

  await knex.schema.alterTable("expenses", (t) => {
    dropReferences(t, ["receipt_file_id", "deleted_by"]);
    t.dropColumns("note", "deleted_at");
    t.string("receipt_url").nullable();
  });

  await knex("stock_entries")
    .whereNull("reason")
    .update({ reason: knex.ref("kind") });

  await knex.schema.alterTable("stock_entries", (t) => {
    t.dropColumns("kind", "ref_type");
    t.string("reason").notNullable().alter();
  });

  await knex.schema.alterTable("shortages", (t) => {
    dropReferences(t, ["excluded_run_id", "deducted_run_id", "dismissed_by"]);
    t.dropColumns("exclusion_reason", "dismissed_at", "dismiss_reason");
    t.boolean("approved_for_deduction").notNullable().defaultTo(false);
    employee(t, "approved_by", true);
  });

  await knex.schema.alterTable("container_counts", (t) => {
    t.dropUnique(["date", "container_type"]);
  });

  await knex("customer_ownerships").where({ event: "assigned" }).update({ event: "reassigned" });

  await knex.schema.alterTable("customer_ownerships", (t) => {
    t.enu("event", INIT_OWNERSHIP_EVENTS).notNullable().alter();
  });

  await knex.schema.alterTable("deposit_entries", (t) => {
    t.dropIndex(["ref_type", "ref_id"]);
    dropReferences(t, ["trip_id", "drawer_session_id"]);
    t.dropColumns("method", "ref_type", "ref_id");
  });

  await knex.schema.alterTable("walk_in_sales", (t) => {
    t.dropColumn("voided_at");
    t.integer("deposit_collected").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("deliveries", (t) => {
    // MySQL dropped the implicit FK indexes once the composites below could back the FKs; restore them first.
    t.index(["customer_id"], "deliveries_customer_id_foreign");
    t.index(["trip_id"], "deliveries_trip_id_foreign");
    t.dropIndex(["customer_id", "created_at"]);
    t.dropIndex(["trip_id", "customer_id"]);
    t.dropColumn("voided_at");
    t.uuid("product_id").nullable();
    t.integer("delivered").notNullable();
    t.integer("empties_collected").notNullable();
    t.integer("deposit_collected").notNullable().defaultTo(0);
  });

  await knex.raw(`
    UPDATE deliveries d
    JOIN (
      SELECT delivery_id, MIN(product_id) AS product_id, SUM(qty) AS delivered, SUM(empties_collected) AS empties_collected
      FROM delivery_lines GROUP BY delivery_id
    ) l ON l.delivery_id = d.id
    SET d.product_id = l.product_id, d.delivered = l.delivered, d.empties_collected = l.empties_collected
  `);

  await knex.schema.alterTable("deliveries", (t) => {
    t.uuid("product_id").notNullable().alter();
    t.foreign("product_id").references("products.id");
  });

  await knex("trips").where({ status: "returning" }).update({ status: "open" });

  await knex.schema.alterTable("trips", (t) => {
    dropReferences(t, ["received_by", "received_drawer_session_id"]);
    t.dropColumn("ended_at");
    t.enu("status", INIT_TRIP_STATUSES).notNullable().defaultTo("open").alter();
  });

  await knex.schema.alterTable("payments", (t) => {
    t.dropColumns("method", "voided_at");
  });

  await knex.schema.alterTable("pay_lines", (t) => {
    t.dropColumns("days_worked_override", "paid_leave_days", "unpaid_leave_days", "credit_held", "credit_recovered", "carried_over");
  });

  await knex.schema.alterTable("pay_plans", (t) => {
    t.dropColumns("rest_weekday", "pto_days_override", "max_loan_amount_override");
  });

  await knex.schema.alterTable("employees", (t) => {
    t.string("name").nullable();
  });

  await knex("employees").update({ name: knex.raw("TRIM(CONCAT(first_name, ' ', last_name))") });

  await knex.schema.alterTable("employees", (t) => {
    t.dropIndex(["last_name", "first_name"]);
    t.dropColumns("hire_date", "first_name", "last_name");
    t.string("name").notNullable().alter();
  });

  for (const table of NEW_TABLES.toReversed()) {
    await knex.schema.dropTableIfExists(table);
  }
}
