import type { TDrawerSession } from "@wrs/contract/drawer";
import type { Knex } from "knex";
import type { TActor, TCtx } from "../../src/lib/context/makeCtx.ts";
import { manilaDate } from "../../src/lib/dates/manilaDate.ts";
import { manilaDayBounds } from "../../src/lib/dates/manilaDayBounds.ts";
import { manilaToday } from "../../src/lib/dates/manilaToday.ts";
import { EMPLOYEE, id } from "./index.ts";

export type TSeedDay = {
  db: Knex;
  date: string;
  isToday: boolean;
  rand: () => number;
  at: (time: string) => Date;
  ctxFor: (actor: TActor, time: string, mode?: TCtx["mode"]) => TCtx;
  cashierSession: TDrawerSession;
};

export type TSeedRun = {
  db: Knex;
  dates: string[];
  today: string;
  rand: () => number;
  ctxFor: (actor: TActor, now: Date, mode?: TCtx["mode"]) => TCtx;
};

export type THistoryHook = { day?(day: TSeedDay): Promise<void>; after?(run: TSeedRun): Promise<void> };

export const SEED_ACTOR = {
  owner: { id: EMPLOYEE.owner, name: "Demo Owner", roles: ["owner", "cashier", "rider", "washer", "helper"], activeRole: "owner" },
  cashier: { id: EMPLOYEE.cashier, name: "Ligaya Santos", roles: ["cashier"], activeRole: "cashier" },
  rider1: { id: EMPLOYEE.rider1, name: "Mario Cruz", roles: ["rider"], activeRole: "rider" },
  rider2: { id: EMPLOYEE.rider2, name: "Ramil Bautista", roles: ["rider"], activeRole: "rider" },
  multi: { id: EMPLOYEE.multi, name: "Corazon Villanueva", roles: ["cashier", "rider"], activeRole: "rider" },
} satisfies Record<string, TActor>;

const HISTORY_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

export const historyWindow = (runNow = new Date()) => {
  const today = manilaToday(runNow);
  const todayStart = manilaDayBounds(today).start.getTime();
  const dates = Array.from({ length: HISTORY_DAYS + 1 }, (_, i) => manilaDate(new Date(todayStart - (HISTORY_DAYS - i) * DAY_MS + DAY_MS / 2)));

  return { today, dates, masterDataAt: new Date(todayStart - (HISTORY_DAYS + 1) * DAY_MS) };
};

const counters = new Map<number, number>();

export const nextId = (group: number) => {
  const n = (counters.get(group) ?? 0) + 1;

  counters.set(group, n);

  return id(group, n);
};

export const pick = <T>(rand: () => number, items: readonly [T, ...T[]]): T => items[Math.floor(rand() * items.length)] ?? items[0];

export const between = (rand: () => number, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

export const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
