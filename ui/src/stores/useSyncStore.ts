import type { TSyncOp } from "@wrs/contract/sync";

import { ApiError } from "@/lib/http";
import { openOfflineDb, type TConflictRecord, type TOutboxRecord, type TOutboxState } from "@/lib/offlineDb";
import { pullSnapshot, pushOps } from "@/services/sync";

type TSyncOpDraft = TSyncOp extends infer TOp ? (TOp extends TSyncOp ? Omit<TOp, "opId" | "occurredAt"> & { opId?: string } : never) : never;

type TOfflineDb = Awaited<ReturnType<typeof openOfflineDb>>;

const BATCH_SIZE = 50;
const RETRY_MS = 30_000;
const PULL_MS = 60_000;
const OUTDATED_APP_MESSAGE = "Update the app";

function toOp({ seq, state, lastError, ...op }: TOutboxRecord): TSyncOp {
  return op;
}

export const useSyncStore = defineStore("sync", () => {
  const rider = useRiderStore();
  const isOnline = useOnline();

  const pending = ref<TOutboxRecord[]>([]);
  const conflicts = ref<TConflictRecord[]>([]);
  const isSyncing = ref(false);

  const status = computed(() => {
    if (!isOnline.value) {
      return "offline";
    }

    if (pending.value.some(({ state }) => state === "failed")) {
      return "failed";
    }

    if (isSyncing.value) {
      return "syncing";
    }

    if (pending.value.length > 0) {
      return "pending";
    }

    return conflicts.value.length > 0 ? "conflict" : "synced";
  });

  async function loadOutbox(db: TOfflineDb) {
    const [outbox, conflictRecords] = await Promise.all([db.getAllFromIndex("outbox", "seq"), db.getAll("conflicts")]);

    pending.value = outbox;
    conflicts.value = conflictRecords;
  }

  async function setState({ db, records, state, lastError }: { db: TOfflineDb; records: TOutboxRecord[]; state: TOutboxState; lastError?: string }) {
    const tx = db.transaction("outbox", "readwrite");

    await Promise.all([...records.map((record) => tx.store.put({ ...record, state, lastError })), tx.done]);
  }

  async function pushBatch(db: TOfflineDb) {
    const outbox = await db.getAllFromIndex("outbox", "seq");
    const batch = outbox.filter(({ state }) => state === "pending").slice(0, BATCH_SIZE);

    if (batch.length === 0) {
      return false;
    }

    await setState({ db, records: batch, state: "sending" });

    try {
      const { results } = await pushOps({ ops: batch.map(toOp) });
      const settled = new Map(results.map((result) => [result.opId, result]));
      const tx = db.transaction(["outbox", "conflicts"], "readwrite");

      await Promise.all([
        ...batch.map((record) => {
          const result = settled.get(record.opId);

          if (result == null) {
            return tx.objectStore("outbox").put({ ...record, state: "pending" });
          }

          if (result.status === "conflict") {
            tx.objectStore("conflicts").put({ opId: record.opId, op: toOp(record), codes: result.codes ?? [], conflictId: result.conflictId });
          }

          return tx.objectStore("outbox").delete(record.opId);
        }),
        tx.done,
      ]);

      return settled.size === batch.length;
    } catch (error) {
      const isOutdatedApp = error instanceof ApiError && error.status === 400;

      await setState({ db, records: batch, state: isOutdatedApp ? "failed" : "pending", lastError: isOutdatedApp ? OUTDATED_APP_MESSAGE : undefined });
      throw error;
    }
  }

  async function pull() {
    const db = await openOfflineDb();
    const [record] = await db.getAll("snapshot");
    const isFresh = record != null && isSameManilaDay(record.syncedAt, Date.now());
    const snapshot = await pullSnapshot(isFresh ? record.cursor : undefined);

    await rider.applySnapshot(snapshot);
  }

  async function flush() {
    if (!isOnline.value) {
      return;
    }

    const db = await openOfflineDb();

    await navigator.locks.request("wrs-sync", async () => {
      isSyncing.value = true;

      try {
        const orphans = (await db.getAllFromIndex("outbox", "seq")).filter(({ state }) => state === "sending");

        await setState({ db, records: orphans, state: "pending" });

        let hasMore = true;

        while (hasMore) {
          hasMore = await pushBatch(db);
        }

        await pull();
      } catch (error) {
        console.error(error);
      } finally {
        await loadOutbox(db);
        isSyncing.value = false;
      }
    });
  }

  async function enqueue({ opId, ...draft }: TSyncOpDraft) {
    const db = await openOfflineDb();
    const tx = db.transaction("outbox", "readwrite");
    const last = await tx.store.index("seq").openCursor(null, "prev");

    await Promise.all([
      tx.store.add({ ...draft, opId: opId ?? crypto.randomUUID(), occurredAt: new Date().toISOString(), seq: (last?.value.seq ?? 0) + 1, state: "pending" }),
      tx.done,
    ]);

    await loadOutbox(db);
    await flush();
  }

  async function dismissConflict(opId: string) {
    const db = await openOfflineDb();

    await db.delete("conflicts", opId);
    await loadOutbox(db);
  }

  const retryTimer = useIntervalFn(
    () => {
      if (pending.value.some(({ state }) => state === "pending")) {
        flush();
      }
    },
    RETRY_MS,
    { immediate: false }
  );

  const pullTimer = useIntervalFn(
    async () => {
      if (!isOnline.value) {
        return;
      }

      try {
        await pull();
      } catch (error) {
        console.error(error);
      }
    },
    PULL_MS,
    { immediate: false }
  );

  let stopOnlineWatch: (() => void) | undefined;

  async function start() {
    const db = await openOfflineDb();

    await Promise.all([rider.hydrate(), loadOutbox(db)]);
    await setState({ db, records: pending.value.filter(({ state }) => state === "failed"), state: "pending" });

    stopOnlineWatch ??= watch(isOnline, (isNowOnline) => {
      if (isNowOnline) {
        flush();
      }
    });

    retryTimer.resume();
    pullTimer.resume();

    await flush();
  }

  function stop() {
    stopOnlineWatch?.();
    stopOnlineWatch = undefined;
    retryTimer.pause();
    pullTimer.pause();
  }

  return { isOnline, status, pending, conflicts, dismissConflict, enqueue, flush, pull, start, stop };
});
