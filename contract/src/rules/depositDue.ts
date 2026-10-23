import type { TContainerType, TContainerTypeCode } from "../container.ts";
import type { TCustomer } from "../customer.ts";

export function depositDue({
  customer,
  containerTypes,
  borrowed,
}: {
  customer: Pick<TCustomer, "heldByType" | "depositOnFile" | "depositWaived">;
  containerTypes: Pick<TContainerType, "code" | "depositAmount">[];
  borrowed: { containerType: TContainerTypeCode; qty: number }[];
}): number {
  if (customer.depositWaived) {
    return 0;
  }

  let required = 0;

  for (const { code, depositAmount } of containerTypes) {
    const borrowedQty = borrowed.filter(({ containerType }) => containerType === code).reduce((sum, { qty }) => sum + qty, 0);
    const held = Math.max(0, (customer.heldByType[code] ?? 0) + borrowedQty);

    required += held * depositAmount;
  }

  return Math.max(0, required - customer.depositOnFile);
}
