import { readdir } from "node:fs/promises";
import type { Knex } from "knex";
import { closeDrawer, drawerBreakdown, openDrawer } from "../src/domain/drawer.ts";
import { makeCtx, type TActor, type TCtx } from "../src/lib/context/makeCtx.ts";
import { mulberry32 } from "./ids/index.ts";
import { SEED_ACTOR, between, historyWindow, type THistoryHook } from "./ids/history.ts";

const OPENING_CASH = 200000;

const isHistoryModule = (mod: unknown): mod is { hook: THistoryHook } =>
  typeof mod === "object" && mod != null && "hook" in mod && typeof mod.hook === "object";

const loadHooks = async () => {
  const directory = new URL("./history/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => /^[^.]+\.ts$/.test(file)).toSorted();
  const hooks: THistoryHook[] = [];

  for (const file of files) {
    const mod: unknown = await import(new URL(file, directory).href);

    if (!isHistoryModule(mod)) {
      throw new Error(`seeds/history/${file} must export a hook`);
    }

    hooks.push(mod.hook);
  }

  return hooks;
};

export async function seed(knex: Knex) {
  const runNow = new Date();
  const { today, dates } = historyWindow(runNow);
  const hooks = (await loadHooks()).map((hook, i) => ({ ...hook, rand: mulberry32(i + 1) }));
  const drawerRand = mulberry32(0);

  const ctxAt = (actor: TActor, now: Date, mode: TCtx["mode"] = "strict") =>
    makeCtx({ db: knex, actor, now: new Date(Math.min(now.getTime(), runNow.getTime())), mode });

  for (const date of dates) {
    const at = (time: string) => new Date(Math.min(new Date(`${date}T${time}:00+08:00`).getTime(), runNow.getTime()));
    const ctxFor = (actor: TActor, time: string, mode?: TCtx["mode"]) => ctxAt(actor, at(time), mode);
    const isToday = date === today;
    const cashierSession = await openDrawer(ctxFor(SEED_ACTOR.cashier, "07:00"), { openingCash: OPENING_CASH });

    for (const { day, rand } of hooks) {
      await day?.({ db: knex, date, isToday, rand, at, ctxFor, cashierSession });
    }

    if (!isToday) {
      const close = ctxFor(SEED_ACTOR.cashier, "19:00");
      const { expected } = await drawerBreakdown(close, cashierSession.id);
      const shortfall = drawerRand() < 0.15 ? between(drawerRand, 1, 10) * 1000 : 0;

      await closeDrawer(close, { countedCash: Math.max(0, expected - shortfall) });
    }
  }

  for (const { after, rand } of hooks) {
    await after?.({ db: knex, dates, today, rand, ctxFor: ctxAt });
  }
}
