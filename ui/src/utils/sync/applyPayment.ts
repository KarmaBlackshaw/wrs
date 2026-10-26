import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyPayment(snapshot: TRiderSnapshot, op: Extract<TSyncOp, { kind: "payment.create" }>): TRiderSnapshot {
  const { customerId, amount, method, tripId } = op.payload;
  const { trip } = snapshot;

  return {
    ...snapshot,
    trip: trip != null && trip.id === tripId && method === "cash" ? { ...trip, expectedCash: trip.expectedCash + amount } : trip,
    customers: snapshot.customers.map((entry) => (entry.id === customerId ? { ...entry, creditBalance: entry.creditBalance - amount } : entry)),
  };
}
