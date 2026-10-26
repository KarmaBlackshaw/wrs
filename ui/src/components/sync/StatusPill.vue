<script setup lang="ts">
import type { TTone } from "@/types";

const syncStore = useSyncStore();

const isSheetOpen = ref(false);

const pill = computed<{ copy: string; tone: TTone }>(() => {
  const { status, pending, conflicts } = syncStore;
  const count = pending.length;

  switch (status) {
    case "offline":
      return count > 0 ? { copy: `Offline · ${count} pending`, tone: "warn" } : { copy: "Offline", tone: "neutral" };
    case "failed":
      return { copy: `${pending.filter(({ state }) => state === "failed").length} failed — update the app`, tone: "danger" };
    case "syncing":
      return { copy: "Syncing…", tone: "info" };
    case "pending":
      return { copy: `${count} pending`, tone: "warn" };
    case "conflict":
      return { copy: `${conflicts.length} sent to owner`, tone: "warn" };
    default:
      return { copy: "Synced", tone: "ok" };
  }
});
</script>

<template>
  <button
    type="button"
    class="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    :aria-label="`Sync status: ${pill.copy}. Open pending items`"
    @click="isSheetOpen = true"
  >
    <UiStatusPill :tone="pill.tone">{{ pill.copy }}</UiStatusPill>
  </button>
  <SyncPendingSheet v-model:open="isSheetOpen" />
</template>
