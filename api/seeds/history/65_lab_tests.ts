import { createFile } from "../../src/domain/file.ts";
import { createLabTest } from "../../src/domain/water.ts";
import { manilaDate } from "../../src/lib/dates/manilaDate.ts";
import { SEED_ACTOR, type THistoryHook } from "../ids/history.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

const REPORT = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
);

export const hook: THistoryHook = {
  async after({ dates, today, ctxFor }) {
    const addDays = (date: string, days: number) => manilaDate(new Date(Date.parse(`${date}T12:00:00+08:00`) + days * DAY_MS));

    const tests = [
      { type: "Bacteriological (coliform)", date: dates[2], result: "Negative, safe to drink", nextDue: addDays(today, 5) },
      { type: "Physical-chemical", date: dates[30], result: "Within standards", nextDue: addDays(today, 60) },
    ];

    for (const { date, ...test } of tests) {
      if (!date) {
        continue;
      }

      const ctx = ctxFor(SEED_ACTOR.owner, new Date(`${date}T10:00:00+08:00`));
      const file = await createFile(ctx, { originalName: `${test.type}.pdf`, mime: "application/pdf", content: REPORT });

      await createLabTest(ctx, { ...test, date, fileId: file.id });
    }
  },
};
