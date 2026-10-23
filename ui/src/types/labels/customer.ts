import type { TOwnershipEvent } from "@wrs/contract/customer";

export const OWNERSHIP_EVENT_LABEL: Record<TOwnershipEvent, string> = {
  created: "Created",
  claimed_by_delivery: "Claimed by delivery",
  released: "Released",
  released_early: "Released early",
  reassigned: "Reassigned",
  assigned: "Assigned",
};
