import { createExpense } from "../../src/domain/expense.ts";
import { CONSUMABLE, ID_GROUP, id } from "../ids/index.ts";
import { SEED_ACTOR, between, historyWindow, pick, type THistoryHook, type TSeedDay } from "../ids/history.ts";

const CATEGORY = {
  consumables: id(ID_GROUP.expenseCategory, 1),
  electricity: id(ID_GROUP.expenseCategory, 2),
  waterSupply: id(ID_GROUP.expenseCategory, 3),
  fuel: id(ID_GROUP.expenseCategory, 4),
  repairs: id(ID_GROUP.expenseCategory, 5),
  rent: id(ID_GROUP.expenseCategory, 8),
  other: id(ID_GROUP.expenseCategory, 9),
};

const pesos = (amount: number) => amount * 100;

const ownerExpenses = async ({ rand, ctxFor }: TSeedDay, index: number) => {
  const ctx = ctxFor(SEED_ACTOR.owner, "12:00");

  if (index % 15 === 1) {
    await createExpense(ctx, { categoryId: CATEGORY.rent, amount: pesos(15000), note: "Monthly rent" });
  }

  if (index % 15 === 7) {
    await createExpense(ctx, { categoryId: CATEGORY.electricity, amount: pesos(between(rand, 6000, 9000)), note: "Meralco bill" });
  }

  if (index % 10 === 4) {
    await createExpense(ctx, { categoryId: CATEGORY.waterSupply, amount: pesos(between(rand, 800, 1500)), note: "Source water delivery" });
  }

  if (index === 12) {
    await createExpense(ctx, { categoryId: CATEGORY.consumables, amount: pesos(1800), consumableId: CONSUMABLE.cap, qty: 500, note: "Caps restock" });
  }

  if (index === 13) {
    await createExpense(ctx, { categoryId: CATEGORY.consumables, amount: pesos(1200), consumableId: CONSUMABLE.seal, qty: 400, note: "Seals restock" });
  }

  if (index === 30) {
    await createExpense(ctx, { categoryId: CATEGORY.consumables, amount: pesos(1800), consumableId: CONSUMABLE.cap, qty: 500, note: "Caps restock" });
  }

  if (rand() < 0.05) {
    await createExpense(ctx, { categoryId: CATEGORY.repairs, amount: pesos(between(rand, 300, 1500)), note: "Pump repair" });
  }
};

const drawerExpenses = async ({ rand, ctxFor }: TSeedDay, index: number) => {
  const ctx = ctxFor(SEED_ACTOR.cashier, "11:00");

  if (index === 20) {
    await createExpense(ctx, { categoryId: CATEGORY.consumables, amount: pesos(480), consumableId: CONSUMABLE.sanitizer, qty: 2, note: "Sanitizer" });

    return;
  }

  if (rand() < 0.25) {
    const [categoryId, note] = pick(rand, [
      [CATEGORY.fuel, "Delivery fuel"],
      [CATEGORY.other, "Cleaning supplies"],
      [CATEGORY.other, "Ice bags"],
    ]);

    await createExpense(ctx, { categoryId, amount: pesos(between(rand, 50, 400)), note });
  }
};

export const hook: THistoryHook = {
  async day(day) {
    const index = historyWindow().dates.indexOf(day.date);

    await ownerExpenses(day, index);
    await drawerExpenses(day, index);
  },
};
