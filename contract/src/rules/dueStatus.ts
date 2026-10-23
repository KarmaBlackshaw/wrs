import type { TCustomer, TDueStatus } from "../customer.ts";

export function dueStatus(customer: Pick<TCustomer, "nextDueOn">, today: string): TDueStatus {
  const { nextDueOn } = customer;

  if (nextDueOn == null || nextDueOn === today) {
    return "due";
  }

  return nextDueOn < today ? "overdue" : "not_due";
}
