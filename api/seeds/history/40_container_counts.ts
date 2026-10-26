import { createMovement, submitCounts } from "../../src/domain/container-log.ts";
import { returnContainers } from "../../src/domain/container-return.ts";
import { stationHoldings } from "../../src/domain/container.ts";
import { getCustomer } from "../../src/domain/customer.ts";
import { SEED_ACTOR, type THistoryHook, type TSeedDay } from "../ids/history.ts";

const returnOne = async ({ db, rand, ctxFor }: TSeedDay) => {
  const customers: { id: string }[] = await db("customers").orderBy("id").select("id");
  const customer = customers[Math.floor(rand() * customers.length)];

  if (!customer) {
    return;
  }

  const ctx = ctxFor(SEED_ACTOR.cashier, "14:00");
  const { heldByType } = await getCustomer(ctx, customer.id);

  if ((heldByType.round ?? 0) >= 2) {
    await returnContainers(ctx, { customerId: customer.id, lines: [{ containerType: "round", qty: 1 }] });
  }
};

const writeOffDamaged = async ({ ctxFor }: TSeedDay) => {
  const ctx = ctxFor(SEED_ACTOR.owner, "12:00");
  const round = (await stationHoldings(ctx)).find(({ containerType }) => containerType === "round");

  if (round && round.empty > 0) {
    await createMovement(ctx, { type: "damaged", containerType: "round", qty: 1, full: false, reason: "Cracked during washing" });
  }
};

export const hook: THistoryHook = {
  async day(day) {
    const { rand, ctxFor, isToday } = day;

    if (rand() < 0.15) {
      await returnOne(day);
    }

    if (rand() < 0.06) {
      await writeOffDamaged(day);
    }

    if (isToday) {
      return;
    }

    const ctx = ctxFor(SEED_ACTOR.cashier, "18:30");
    const holdings = await stationHoldings(ctx);

    await submitCounts(ctx, {
      counts: holdings.map(({ containerType, full, empty }) => ({ containerType, full, empty: Math.max(0, empty - (rand() < 0.1 ? 1 : 0)) })),
    });
  },
};
