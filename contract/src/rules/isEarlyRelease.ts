import type { TCustomer } from "../customer.ts";

export function isEarlyRelease(customer: Pick<TCustomer, "nextDueOn">, today: string): boolean {
  return customer.nextDueOn != null && customer.nextDueOn > today;
}
