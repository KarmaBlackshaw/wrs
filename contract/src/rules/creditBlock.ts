import type { TCustomer } from "../customer.ts";

export function creditBlock(
  customer: Pick<TCustomer, "creditEnabled" | "creditBalance" | "creditLimit">,
  amount: number
): "credit.not_enabled" | "credit.over_limit" | "setting.not_set" | undefined {
  if (!customer.creditEnabled) {
    return "credit.not_enabled";
  }

  if (customer.creditLimit == null) {
    return "setting.not_set";
  }

  return customer.creditBalance + amount > customer.creditLimit ? "credit.over_limit" : undefined;
}
