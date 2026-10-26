<script setup lang="ts">
import { ROUTES } from "@/types";

definePage({ meta: { title: "Return summary" } });

const riderStore = useRiderStore();
const syncStore = useSyncStore();
const { trip, isHydrated } = storeToRefs(riderStore);
const { pending } = storeToRefs(syncStore);
const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirmDialog = useConfirm();

const isTrip = computed(() => trip.value?.id === route.params.id);
const isOpen = computed(() => isTrip.value && trip.value?.status === "open");
const expectedFull = computed(() => trip.value?.lines.reduce((sum, { expectedFull: qty }) => sum + qty, 0) ?? 0);
const emptiesCollected = computed(() => trip.value?.lines.reduce((sum, { emptiesCollected: qty }) => sum + qty, 0) ?? 0);

function endMessage() {
  const count = pending.value.length;

  return count > 0
    ? `${count} ${count === 1 ? "item is" : "items are"} still pending and will sync when you're back online.\nEnd the trip anyway? Deliveries lock once it's ended.`
    : "Deliveries lock once the trip is ended.";
}

async function endTrip() {
  if (trip.value == null) {
    return;
  }

  const isConfirmed = await confirmDialog.confirm({ title: "End trip", message: endMessage(), confirmLabel: "End trip" });

  if (!isConfirmed) {
    return;
  }

  await syncStore.enqueue({ kind: "trip.end", payload: { tripId: trip.value.id } });
  toast.show("Trip ended");
  router.push(ROUTES.RIDER.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Return summary" :subtitle="isTrip && trip != null ? `Trip ${trip.id}` : undefined" :back="ROUTES.RIDER.INDEX">
      <template #actions>
        <UiButton v-if="isOpen" @click="endTrip">End trip</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!isHydrated" title="Loading" description="Reading your saved trip." />

    <UiEmptyState v-else-if="!isTrip || trip == null" title="Trip not found" description="This trip may not exist." />

    <template v-else>
      <div class="grid grid-cols-2 gap-3">
        <UiStatCard label="Expected full">{{ expectedFull }}</UiStatCard>
        <UiStatCard label="Expected empties">{{ emptiesCollected }}</UiStatCard>
      </div>

      <UiCard title="Expected cash">
        <UiMoneyText :centavos="trip.expectedCash" size="xl" />
      </UiCard>
    </template>
  </div>
</template>
