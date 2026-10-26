import type { TSyncOp } from "@wrs/contract/sync";

import type { TRiderSnapshot } from "@/lib/offlineDb";

export function applyTripEnd(snapshot: TRiderSnapshot, op: Extract<TSyncOp, { kind: "trip.end" }>): TRiderSnapshot {
  const { trip } = snapshot;

  if (trip == null || trip.id !== op.payload.tripId || trip.status !== "open") {
    return snapshot;
  }

  return { ...snapshot, trip: { ...trip, status: "returning", endedAt: op.occurredAt } };
}
