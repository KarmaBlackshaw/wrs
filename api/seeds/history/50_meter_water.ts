import { logMeterReading } from "../../src/domain/meter-reading.ts";
import { createWaterReading } from "../../src/domain/water.ts";
import { SEED_ACTOR, between, historyWindow, type THistoryHook } from "../ids/history.ts";

const METER_START = 100000;
const LITERS_PER_DAY = 1000;
const OUT_OF_RANGE_DAY = 38;
const OUT_OF_RANGE_TDS = 14;

export const hook: THistoryHook = {
  async day({ date, rand, ctxFor }) {
    const { dates } = historyWindow();
    const index = dates.indexOf(date);
    const isLast = index === dates.length - 1;

    for (const time of ["08:30", "15:30"]) {
      const isOutOfRange = (index === OUT_OF_RANGE_DAY && time === "08:30") || (isLast && time === "15:30");
      const tds = isOutOfRange ? OUT_OF_RANGE_TDS : between(rand, 2, 8);

      await createWaterReading(ctxFor(SEED_ACTOR.cashier, time), { tds, ph: between(rand, 65, 75) / 10 });
    }

    await logMeterReading(ctxFor(SEED_ACTOR.cashier, "18:00"), { liters: METER_START + LITERS_PER_DAY * (index + 1) });
  },
};
