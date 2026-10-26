<script setup lang="ts">
import { ROUTES } from "@/types";

definePage({ meta: { title: "Return summary" } });

const route = useRoute();
const router = useRouter();
const toast = useToast();

const tripId = computed(() => String(route.params.id));
const summary = computed(() => tripSummary(tripId.value));

function submitReturn() {
  toast.show("Saved");
  router.push(ROUTES.RIDER.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Return summary" :subtitle="summary.trip ? `Trip ${summary.trip.id}` : undefined" :back="ROUTES.RIDER.INDEX">
      <template #actions>
        <UiButton v-if="summary.trip" @click="submitReturn">Submit return</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!summary.trip" title="Trip not found" description="This trip may not exist." />

    <template v-else>
      <div class="grid grid-cols-2 gap-3">
        <UiStatCard label="Expected full">{{ summary.expectedFull }}</UiStatCard>
        <UiStatCard label="Expected empties">{{ summary.emptiesCollected }}</UiStatCard>
      </div>

      <UiCard title="Expected cash">
        <UiMoneyText :centavos="summary.expectedCash" size="xl" />
      </UiCard>
    </template>
  </div>
</template>
