import type { TErrorCode } from "@wrs/contract/common";
import type { TCustomer } from "@wrs/contract/customer";
import type { TSyncOp, TSyncSnapshot } from "@wrs/contract/sync";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type TRiderSnapshot = Pick<TSyncSnapshot, "trip" | "customers" | "products" | "containerTypes">;

export type TSnapshotRecord = Omit<TRiderSnapshot, "customers"> & { key: string; cursor: string; syncedAt: string };

export type TOutboxState = "pending" | "sending" | "failed";

export type TOutboxRecord = TSyncOp & { seq: number; state: TOutboxState; lastError?: string; settledAt?: string };

export type TConflictRecord = { opId: string; op: TSyncOp; codes: TErrorCode[]; conflictId?: string };

export interface TOfflineSchema extends DBSchema {
  snapshot: { key: string; value: TSnapshotRecord };
  customers: { key: string; value: TCustomer };
  outbox: { key: string; value: TOutboxRecord; indexes: { seq: number } };
  conflicts: { key: string; value: TConflictRecord };
}

let cached: { employeeId: string; db: Promise<IDBPDatabase<TOfflineSchema>> } | undefined;

function forget(employeeId: string) {
  if (cached?.employeeId === employeeId) {
    cached = undefined;
  }
}

async function closeQuietly(db: Promise<IDBPDatabase<TOfflineSchema>>) {
  try {
    const connection = await db;

    connection.close();
  } catch (error) {
    console.error(error);
  }
}

function open(employeeId: string) {
  const db = openDB<TOfflineSchema>(`wrs-rider-${employeeId}`, 1, {
    upgrade(database) {
      database.createObjectStore("snapshot", { keyPath: "key" });
      database.createObjectStore("customers", { keyPath: "id" });
      database.createObjectStore("outbox", { keyPath: "opId" }).createIndex("seq", "seq", { unique: true });
      database.createObjectStore("conflicts", { keyPath: "opId" });
    },
    blocking() {
      forget(employeeId);
      void closeQuietly(db);
    },
    terminated() {
      forget(employeeId);
    },
  });

  return db;
}

export async function openOfflineDb(): Promise<IDBPDatabase<TOfflineSchema>> {
  const auth = useAuthStore();

  if (auth.me == null) {
    throw new Error("Offline storage needs a signed-in employee.");
  }

  const employeeId = auth.me.id;

  if (cached?.employeeId === employeeId) {
    return cached.db;
  }

  if (cached != null) {
    void closeQuietly(cached.db);
  }

  const db = open(employeeId);

  cached = { employeeId, db };

  try {
    return await db;
  } catch (error) {
    forget(employeeId);
    throw error;
  }
}
