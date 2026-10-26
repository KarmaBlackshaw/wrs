import type { TLoanRequest } from "@wrs/contract/loan";
import { createFile } from "../../src/domain/file.ts";
import { rejectLoan, releaseLoan, requestLoan } from "../../src/domain/loan.ts";
import type { TActor } from "../../src/lib/context/makeCtx.ts";
import { SEED_ACTOR, type THistoryHook } from "../ids/history.ts";

type TDecision = { kind: "release" } | { kind: "reject"; reason: string };

type TSeedLoan = { actor: TActor; daysAgo: number; body: TLoanRequest; decision?: TDecision };

const IOU = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

const LOANS: TSeedLoan[] = [
  { actor: SEED_ACTOR.rider2, daysAgo: 20, body: { type: "loan", principal: 300000, termMonths: 3 }, decision: { kind: "release" } },
  { actor: SEED_ACTOR.cashier, daysAgo: 8, body: { type: "advance", principal: 100000 }, decision: { kind: "release" } },
  {
    actor: SEED_ACTOR.multi,
    daysAgo: 12,
    body: { type: "advance", principal: 250000 },
    decision: { kind: "reject", reason: "Already has an advance this pay period" },
  },
  { actor: SEED_ACTOR.rider1, daysAgo: 0, body: { type: "advance", principal: 150000 } },
  { actor: SEED_ACTOR.cashier, daysAgo: 0, body: { type: "loan", principal: 500000, termMonths: 6 } },
];

export const hook: THistoryHook = {
  async after({ dates, ctxFor }) {
    const at = (daysAgo: number, time: string) => new Date(`${dates.at(-1 - daysAgo)}T${time}:00+08:00`);

    for (const { actor, daysAgo, body, decision } of LOANS) {
      const loan = await requestLoan(ctxFor(actor, at(daysAgo, "08:30")), body);

      if (!decision) {
        continue;
      }

      const owner = ctxFor(SEED_ACTOR.owner, at(daysAgo - 1, "10:00"));

      if (decision.kind === "reject") {
        await rejectLoan(owner, { id: loan.id, reason: decision.reason });

        continue;
      }

      const file = await createFile(owner, { originalName: `IOU ${loan.employeeName}.pdf`, mime: "application/pdf", content: IOU });

      await releaseLoan(owner, { id: loan.id, authorizationFileId: file.id });
    }
  },
};
