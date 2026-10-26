import type { TDelivery } from "@wrs/contract/trip";
import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyDelivery(snapshot: TRiderSnapshot, op: Extract<TSyncOp, { kind: "delivery.create" }>): TRiderSnapshot {
  const { trip } = snapshot;
  const { payload, occurredAt } = op;

  if (trip == null || trip.id !== payload.tripId) {
    return snapshot;
  }

  const customer = snapshot.customers.find(({ id }) => id === payload.customerId);
  const amount = payload.lines.reduce((sum, { qty, unitPrice }) => sum + qty * unitPrice, 0);
  const depositAmount = payload.deposit?.lines.reduce((sum, { amount: lineAmount }) => sum + lineAmount, 0) ?? 0;

  const delivery: TDelivery = {
    id: payload.id,
    tripId: trip.id,
    customerId: payload.customerId,
    customerName: customer != null ? fullName(customer) : "",
    riderName: trip.riderName,
    lines: payload.lines.map((line) => ({
      ...line,
      productName: trip.lines.find(({ productId }) => productId === line.productId)?.productName ?? "",
    })),
    amount,
    paymentType: payload.paymentType,
    depositCollected: depositAmount,
    voidedAt: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };

  const heldByType = { round: 0, slim: 0, ...customer?.heldByType };

  for (const { productId, qty, emptiesCollected } of payload.lines) {
    const containerType = snapshot.products.find(({ id }) => id === productId)?.containerType;

    if (containerType != null) {
      heldByType[containerType] = Math.max(0, (heldByType[containerType] ?? 0) + qty - emptiesCollected);
    }
  }

  return {
    ...snapshot,
    trip: {
      ...trip,
      lines: trip.lines.map((line) => {
        const sent = payload.lines.find(({ productId }) => productId === line.productId);

        return sent == null
          ? line
          : {
              ...line,
              delivered: line.delivered + sent.qty,
              remaining: line.remaining - sent.qty,
              emptiesCollected: line.emptiesCollected + sent.emptiesCollected,
            };
      }),
      deliveries: [...trip.deliveries, delivery],
    },
    customers: snapshot.customers.map((entry) =>
      entry.id !== payload.customerId
        ? entry
        : {
            ...entry,
            heldByType,
            containersHeld: Object.values(heldByType).reduce((sum, qty) => sum + qty, 0),
            depositOnFile: entry.depositOnFile + depositAmount,
            creditBalance: payload.paymentType === "credit" ? entry.creditBalance + amount : entry.creditBalance,
            lastDeliveredAt: occurredAt,
            riderId: entry.riderId ?? trip.riderId,
            riderName: entry.riderId == null ? trip.riderName : entry.riderName,
          }
    ),
  };
}
