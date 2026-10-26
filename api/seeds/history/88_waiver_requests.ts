import { createCustomer } from "../../src/domain/customer.ts";
import { approveWaiver, requestWaiver } from "../../src/domain/waiver.ts";
import { ID_GROUP } from "../ids/index.ts";
import { SEED_ACTOR, nextId, type THistoryHook } from "../ids/history.ts";

export const hook: THistoryHook = {
  async after({ db, dates, ctxFor }) {
    const at = (daysAgo: number, time: string) => new Date(`${dates.at(-1 - daysAgo)}T${time}:00+08:00`);
    const unwaived = (riderId: string) => db("customers").where({ riderId, depositWaived: false }).orderBy("id").first("id");

    const approved: { id: string } | undefined = await unwaived(SEED_ACTOR.rider1.id);
    const pending: { id: string } | undefined = await unwaived(SEED_ACTOR.rider2.id);

    if (!approved || !pending) {
      throw new Error("Waiver seeds need an unwaived customer for rider1 and rider2");
    }

    const request = await requestWaiver(ctxFor(SEED_ACTOR.rider1, at(15, "11:00")), { id: nextId(ID_GROUP.approvalRequest), customerId: approved.id });

    await approveWaiver(ctxFor(SEED_ACTOR.owner, at(14, "09:00")), request.id);
    await requestWaiver(ctxFor(SEED_ACTOR.rider2, at(0, "09:15")), { id: nextId(ID_GROUP.approvalRequest), customerId: pending.id });

    await createCustomer(ctxFor(SEED_ACTOR.cashier, at(0, "08:45")), {
      firstName: "Estrella",
      lastName: "Manalo",
      phone: "09171234567",
      address: "22 Sampaguita St., Brgy. San Juan, Taytay, Rizal",
      allowDuplicateName: true,
    });
  },
};
