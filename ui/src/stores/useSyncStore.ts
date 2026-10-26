import cloneDeep from "lodash/cloneDeep";
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

function toOp({ seq, state, lastError, settledAt, ...op }: TOutboxRecord): TSyncOp {
  return op;
}

export const useSyncStore = defineStore("sync", () => {
  const rider = useRiderStore();
  const isOnline = useOnline();

  const outbox = ref<TOutboxRecord[]>([]);
  const conflicts = ref<TConflictRecord[]>([]);
  const isSyncing = ref(false);

  const pending = computed(() => outbox.value.filter(({ settledAt }) => settledAt == null));

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
    const [records, conflictRecords] = await Promise.all([db.getAllFromIndex("outbox", "seq"), db.getAll("conflicts")]);

    outbox.value = records;
    conflicts.value = conflictRecords;
  }

  async function setState({ db, records, state, lastError }: { db: TOfflineDb; records: TOutboxRecord[]; state: TOutboxState; lastError?: string }) {
    const tx = db.transaction("outbox", "readwrite");

    await Promise.all([...records.map((record) => tx.store.put({ ...record, state, lastError })), tx.done]);
  }

  async function pushBatch(db: TOfflineDb) {
    const unsettled = (await db.getAllFromIndex("outbox", "seq")).filter(({ settledAt }) => settledAt == null);
    const firstFailed = unsettled.findIndex(({ state }) => state === "failed");
    const batch = (firstFailed === -1 ? unsettled : unsettled.slice(0, firstFailed)).filter(({ state }) => state === "pending").slice(0, BATCH_SIZE);

    if (batch.length === 0) {
      return false;
    }

    await setState({ db, records: batch, state: "sending" });

    try {
      const { results } = await pushOps({ ops: batch.map(toOp) });
      const settled = new Map(results.map((result) => [result.opId, result]));
      const settledAt = new Date().toISOString();
      const tx = db.transaction(["outbox", "conflicts"], "readwrite");

      await Promise.all([
        ...batch.map((record) => {
          const result = settled.get(record.opId);

          if (result == null) {
            return tx.objectStore("outbox").put({ ...record, state: "pending" });
          }

          const settle = tx.objectStore("outbox").put({ ...record, state: "pending", settledAt });

          if (result.status === "conflict") {
            return Promise.all([
              settle,
              tx.objectStore("conflicts").put({ opId: record.opId, op: toOp(record), codes: result.codes ?? [], conflictId: result.conflictId }),
            ]);
          }

          return settle;
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

  function withSyncLock(task: () => Promise<void>) {
    if (navigator.locks == null) {
      return task();
    }

    return navigator.locks.request("wrs-sync", task);
  }

  async function pullUnlocked(db: TOfflineDb) {
    const [record] = await db.getAll("snapshot");
    const isFresh = record != null && isSameManilaDay(record.syncedAt, Date.now());
    const requestedAt = new Date().toISOString();
    const snapshot = await pullSnapshot(isFresh ? record.cursor : undefined);

    await rider.applySnapshot({ snapshot, requestedAt });

    const reflected = (await db.getAll("outbox")).filter(({ settledAt }) => settledAt != null && settledAt <= requestedAt);
    const tx = db.transaction("outbox", "readwrite");

    await Promise.all([...reflected.map(({ opId }) => tx.store.delete(opId)), tx.done]);
    await loadOutbox(db);
  }

  async function pull() {
    try {
      const db = await openOfflineDb();

      await withSyncLock(() => pullUnlocked(db));
    } catch (error) {
      console.error(error);
    }
  }

  async function flush() {
    if (!isOnline.value) {
      return;
    }

    try {
      const db = await openOfflineDb();

      await withSyncLock(async () => {
        isSyncing.value = true;

        try {
          const orphans = (await db.getAllFromIndex("outbox", "seq")).filter(({ state, settledAt }) => state === "sending" && settledAt == null);

          await setState({ db, records: orphans, state: "pending" });

          let hasMore = true;

          while (hasMore) {
            hasMore = await pushBatch(db);
          }

          await pullUnlocked(db);
        } catch (error) {
          console.error(error);
        } finally {
          await loadOutbox(db);
          isSyncing.value = false;
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function enqueue({ opId, ...draft }: TSyncOpDraft) {
    const db = await openOfflineDb();
    const tx = db.transaction("outbox", "readwrite");
    const last = await tx.store.index("seq").openCursor(null, "prev");

    await Promise.all([
      tx.store.add({
        ...cloneDeep(draft),
        opId: opId ?? crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        seq: (last?.value.seq ?? 0) + 1,
        state: "pending",
      }),
      tx.done,
    ]);

    await loadOutbox(db);
    void flush();
  }

  async function dismissConflict(opId: string) {
    const db = await openOfflineDb();

    await db.delete("conflicts", opId);
    await loadOutbox(db);
  }

  const retryTimer = useIntervalFn(
    () => {
      if (pending.value.some(({ state }) => state === "pending")) {
        void flush();
      }
    },
    RETRY_MS,
    { immediate: false }
  );

  const pullTimer = useIntervalFn(
    () => {
      if (isOnline.value) {
        void pull();
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
    await loadOutbox(db);

    stopOnlineWatch ??= watch(isOnline, (isNowOnline) => {
      if (isNowOnline) {
        void flush();
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

  return { isOnline, status, outbox, pending, conflicts, dismissConflict, enqueue, flush, pull, start, stop };
});
