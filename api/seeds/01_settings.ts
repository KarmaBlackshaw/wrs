import type { Knex } from "knex";
import type { TSettingValues } from "@wrs/contract/setting";

const SETTINGS: TSettingValues = {
  "rider.dailyQuota": 100,
  "rider.incentivePerContainer": 500,
  "pay.frequency": "semi_monthly",
  "pay.baseRate": { rider: 55000, cashier: 45000, washer: 40000, helper: 38000 },
  "pay.deductionCapPct": 30,
  "loan.interestRatePct": 2,
  "loan.interestMethod": "flat",
  "loan.maxAmount": 1000000,
  "loan.maxTermMonths": 6,
  "customer.creditLimit": 50000,
  "void.approvalThreshold": 50000,
  "water.tdsRangePpm": { min: 0, max: 10 },
  "labTest.reminderDays": 7,
  "digest.sendTime": "20:00",
  "pto.daysPerYear": 5,
};

export async function seed(knex: Knex) {
  const effective_from = new Date("2024-12-31T16:00:00.000Z");

  await knex("settings").insert(Object.entries(SETTINGS).map(([key, value]) => ({ key, value: JSON.stringify(value), effective_from })));
}
