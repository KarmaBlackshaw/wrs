import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyCustomerCreate(
  snapshot: TRiderSnapshot,
  op: Extract<TSyncOp, { kind: "customer.create" }>,
  actor?: { id: string; name: string }
): TRiderSnapshot {
  const { payload, occurredAt } = op;

  if (snapshot.customers.some(({ id }) => id === payload.id)) {
    return snapshot;
  }

  return {
    ...snapshot,
    customers: [
      ...snapshot.customers,
      {
        id: payload.id,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        address: payload.address,
        status: "pending",
        riderId: actor?.id ?? snapshot.trip?.riderId ?? null,
        riderName: actor?.name ?? snapshot.trip?.riderName ?? null,
        deliveryIntervalDays: payload.deliveryIntervalDays ?? null,
        creditEnabled: false,
        creditLimitOverride: null,
        creditLimit: null,
        depositWaived: false,
        heldByType: { round: 0, slim: 0 },
        containersHeld: 0,
        depositOnFile: 0,
        creditBalance: 0,
        agingBucket: null,
        lastDeliveredAt: null,
        nextDueOn: null,
        dueStatus: "not_due",
        coverage: null,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      },
    ],
  };
}
