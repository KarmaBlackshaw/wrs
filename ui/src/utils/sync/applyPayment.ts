import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyPayment(snapshot: TRiderSnapshot, op: Extract<TSyncOp, { kind: "payment.create" }>): TRiderSnapshot {
  const { customerId, amount } = op.payload;

  return {
    ...snapshot,
    customers: snapshot.customers.map((entry) => (entry.id === customerId ? { ...entry, creditBalance: entry.creditBalance - amount } : entry)),
  };
}
