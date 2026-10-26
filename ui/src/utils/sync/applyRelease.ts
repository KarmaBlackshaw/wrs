import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyRelease(snapshot: TRiderSnapshot, op: Extract<TSyncOp, { kind: "customer.release" }>): TRiderSnapshot {
  const { customerId } = op.payload;

  return {
    ...snapshot,
    customers: snapshot.customers.map((entry) => (entry.id === customerId ? { ...entry, riderId: null, riderName: null } : entry)),
  };
}
