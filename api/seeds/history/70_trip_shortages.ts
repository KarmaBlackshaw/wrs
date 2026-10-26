import { recordShortage } from "../../src/domain/shortage.ts";
import { manilaDayBounds } from "../../src/lib/dates/manilaDayBounds.ts";
import { SEED_ACTOR, between, pick, type THistoryHook } from "../ids/history.ts";

export const hook: THistoryHook = {
  async day({ db, date, isToday, rand, ctxFor }) {
    if (!isToday && rand() >= 0.12) {
      return;
    }

    const { start, end } = manilaDayBounds(date);

    const trips: { id: string }[] = await db("trips")
      .whereIn("status", ["returned", "reconciled"])
      .where("loadedAt", ">=", start)
      .where("loadedAt", "<", end)
      .orderBy("loadedAt")
      .select("id");

    const trip = trips[between(rand, 0, trips.length - 1)];

    if (!trip) {
      return;
    }

    const cash = pick(rand, [0, 2000, 3500, 5000]);

    await recordShortage(ctxFor(SEED_ACTOR.cashier, "17:20"), { source: "trip", refId: trip.id, cash, containers: cash === 0 || rand() < 0.3 ? 1 : 0 });
  },
};
