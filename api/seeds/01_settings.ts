import type { Knex } from "knex";

// ponytail: mock go-live values for dev only; production settings are entered by the owner (section 3).
const SETTINGS = {
  rider_daily_quota: 100,
  incentive_per_container: 300,
  pay_frequency: "weekly",
  base_rate: { rider: 50000, cashier: 300000, washer: 250000, helper: 250000 },
  loan_interest_rate_pct: 2,
  loan_interest_method: "flat",
  max_loan_amount: 1000000,
  max_loan_term_months: 6,
  deduction_cap_pct: 30,
  customer_credit_limit: 50000,
  void_approval_threshold: 50000,
  tds_range_ppm: { min: 0, max: 10 },
  lab_test_reminder_days: 7,
  digest_send_time: "20:00",
};

export async function seed(knex: Knex) {
  const effective_from = new Date();

  await knex("settings").del();
  await knex("settings").insert(Object.entries(SETTINGS).map(([key, value]) => ({ key, value: JSON.stringify(value), effective_from })));
}
