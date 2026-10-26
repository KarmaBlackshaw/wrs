import type { TErrorCode } from "@wrs/contract/common";
import type { TSyncOpKind } from "@wrs/contract/sync";
import type { TOutboxState } from "@/lib/offlineDb";

export const SYNC_CONFLICT_CODE_LABEL: Partial<Record<TErrorCode, string>> = {
  "credit.not_enabled": "Credit not enabled",
  "credit.over_limit": "Over credit limit",
  "deposit.required": "Deposit required",
  "price.changed": "Price changed",
  "trip.not_open": "Trip already closed",
  "trip.over_remaining": "More than left on the trip",
  "delivery.duplicate": "Second delivery to this customer",
  "payment.over_balance": "Payment over balance",
  "customer.duplicate_phone": "Phone already on file",
  "customer.interval_required": "Delivery interval missing",
  "customer.not_owner": "Customer no longer theirs",
};

export const SYNC_OP_STATE_LABEL: Record<TOutboxState, string> = {
  pending: "Waiting",
  sending: "Sending",
  failed: "Failed — update the app",
};

export const SYNC_OP_KIND_LABEL: Record<TSyncOpKind, string> = {
  "customer.create": "New customer",
  "customer.release": "Customer release",
  "delivery.create": "Delivery",
  "payment.create": "Payment",
  "waiver_request.create": "Waiver request",
  "trip.end": "Trip end",
};
