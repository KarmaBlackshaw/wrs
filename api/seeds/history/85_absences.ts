import { createAbsence, previewAbsence } from "../../src/domain/absence.ts";
import { manilaDate } from "../../src/lib/dates/manilaDate.ts";
import { SEED_ACTOR, type THistoryHook } from "../ids/history.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const SUNDAY = 0;

const addDays = (date: string, days: number) => manilaDate(new Date(Date.parse(`${date}T12:00:00+08:00`) + days * DAY_MS));

const isSunday = (date: string) => new Date(`${date}T12:00:00+08:00`).getUTCDay() === SUNDAY;

export const hook: THistoryHook = {
  async after({ dates, today, ctxFor }) {
    const pastSunday = dates.slice(0, -3).findLast(isSunday);

    const absences = [
      ...(pastSunday ? [{ employeeId: SEED_ACTOR.rider1.id, from: pastSunday, to: pastSunday }] : []),
      { employeeId: SEED_ACTOR.rider2.id, from: today, to: addDays(today, 1) },
    ];

    for (const body of absences) {
      const ctx = ctxFor(SEED_ACTOR.owner, new Date(`${body.from}T06:30:00+08:00`));
      const { assignments } = await previewAbsence(ctx, body);

      await createAbsence(ctx, { ...body, coverage: assignments.map(({ customerId, coveringRiderId }) => ({ customerId, coveringRiderId })) });
    }
  },
};
