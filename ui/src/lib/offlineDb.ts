import type { TErrorCode } from "@wrs/contract/common";
import type { TCustomer } from "@wrs/contract/customer";
import type { TSyncOp, TSyncSnapshot } from "@wrs/contract/sync";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type TRiderSnapshot = Pick<TSyncSnapshot, "trip" | "customers" | "products" | "containerTypes">;

export type TSnapshotRecord = Omit<TRiderSnapshot, "customers"> & { key: string; cursor: string; syncedAt: string };

export type TOutboxState = "pending" | "sending" | "failed";

export type TOutboxRecord = TSyncOp & { seq: number; state: TOutboxState; lastError?: string };

export type TConflictRecord = { opId: string; op: TSyncOp; codes: TErrorCode[]; conflictId?: string };

export interface TOfflineSchema extends DBSchema {
  snapshot: { key: string; value: TSnapshotRecord };
  customers: { key: string; value: TCustomer };
  outbox: { key: string; value: TOutboxRecord; indexes: { seq: number } };
  conflicts: { key: string; value: TConflictRecord };
}

export function openOfflineDb(): Promise<IDBPDatabase<TOfflineSchema>> {
  const auth = useAuthStore();

  if (auth.me == null) {
    throw new Error("Offline storage needs a signed-in employee.");
  }

  return openDB<TOfflineSchema>(`wrs-rider-${auth.me.id}`, 1, {
    upgrade(db) {
      db.createObjectStore("snapshot", { keyPath: "key" });
      db.createObjectStore("customers", { keyPath: "id" });
      db.createObjectStore("outbox", { keyPath: "opId" }).createIndex("seq", "seq", { unique: true });
      db.createObjectStore("conflicts", { keyPath: "opId" });
    },
  });
}
