import type { TCustomer } from "@/types";

export function creditBlockReason(customer: TCustomer, amountCentavos: number) {
  if (!customer.creditEnabled) {
    return "Credit not enabled for this customer, take cash";
  }

  if (customer.creditBalance + amountCentavos > (customer.creditLimit ?? 0)) {
    return "Credit limit reached, take cash";
  }

  return null;
}
