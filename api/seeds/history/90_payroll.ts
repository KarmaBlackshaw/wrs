import { createPayRun, finalizePayRun } from "../../src/domain/payroll.ts";
import { SEED_ACTOR, type THistoryHook } from "../ids/history.ts";

const FREQUENCIES = ["daily", "semi_monthly"] as const;
const PERIOD_DAYS = 15;

export const hook: THistoryHook = {
  async after({ dates, ctxFor }) {
    const last = dates.length - 1;

    const periods = [
      { periodStart: dates[0], periodEnd: dates[PERIOD_DAYS - 1], isFinal: true },
      { periodStart: dates[PERIOD_DAYS], periodEnd: dates[PERIOD_DAYS * 2 - 1], isFinal: true },
      { periodStart: dates[PERIOD_DAYS * 2], periodEnd: dates[last], isFinal: false },
    ];

    for (const frequency of FREQUENCIES) {
      for (const { periodStart, periodEnd, isFinal } of periods) {
        if (periodStart == null || periodEnd == null) {
          throw new Error("history window too short for payroll periods");
        }

        const ctx = ctxFor(SEED_ACTOR.owner, new Date(`${periodEnd}T20:00:00+08:00`));
        const { id } = await createPayRun(ctx, { frequency, periodStart, periodEnd });

        if (isFinal) {
          await finalizePayRun(ctx, id);
        }
      }
    }
  },
};
