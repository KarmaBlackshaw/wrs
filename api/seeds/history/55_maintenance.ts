import { logReplacement } from "../../src/domain/maintenance.ts";
import { latestMeterReading } from "../../src/domain/meter-reading.ts";
import { CONSUMABLE } from "../ids/index.ts";
import { SEED_ACTOR, historyWindow, type THistoryHook } from "../ids/history.ts";

const REPLACEMENT_DAYS: Record<number, string[]> = {
  0: [CONSUMABLE.uvLamp],
  1: [CONSUMABLE.roMembrane],
  2: [CONSUMABLE.sedimentFilter],
  3: [CONSUMABLE.carbonFilter],
  15: [CONSUMABLE.sedimentFilter],
  28: [CONSUMABLE.sedimentFilter],
};

export const hook: THistoryHook = {
  async day({ date, ctxFor }) {
    const index = historyWindow().dates.indexOf(date);
    const consumableIds = REPLACEMENT_DAYS[index] ?? [];

    for (const consumableId of consumableIds) {
      const ctx = ctxFor(SEED_ACTOR.owner, "18:30");
      const meterLiters = (await latestMeterReading(ctx)) ?? 0;

      await logReplacement(ctx, { consumableId, at: ctx.now.toISOString(), meterLiters });
    }
  },
};
