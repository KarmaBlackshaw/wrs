<script setup lang="ts">
import { getTrip, receiveTrip } from "@/services/trip";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Receive return" } });

const route = useRoute<"/cashier/trips/[id]/receive">();
const router = useRouter();
const toast = useToast();

const tripId = route.params.id;

const { data: trip, isLoading, error: loadError, reload } = useResource((signal) => getTrip(tripId, signal));
const { run, isRunning, error } = useAction(receiveTrip, { inline: ["trip.not_returning", "drawer.not_open"] });

const counted = ref<Record<string, { full: number; empty: number }>>({});
const cashAmount = ref(0);

watch(trip, (value) => {
  if (value == null) {
    return;
  }

  counted.value = Object.fromEntries(
    value.lines.map((line) => [line.productId, { full: line.returnedFull ?? line.expectedFull, empty: line.returnedEmpty ?? line.emptiesCollected }])
  );
});

const isReceivable = computed(() => trip.value?.status === "returning");
const isDrawerClosed = computed(() => error.value?.code === "drawer.not_open");

function setFull(productId: string, qty: number) {
  const entry = counted.value[productId];

  if (entry) {
    entry.full = qty;
  }
}

function setEmpty(productId: string, qty: number) {
  const entry = counted.value[productId];

  if (entry) {
    entry.empty = qty;
  }
}

async function submit() {
  if (trip.value == null) {
    return;
  }

  const lines = trip.value.lines.map(({ productId }) => ({
    productId,
    returnedFull: counted.value[productId]?.full ?? 0,
    returnedEmpty: counted.value[productId]?.empty ?? 0,
  }));

  await run(tripId, { lines, cashRemitted: cashAmount.value });

  if (error.value != null) {
    return;
  }

  toast.show("Saved");
  router.push(ROUTES.CASHIER.TRIPS.INDEX);
}
</script>

<template>
  <UiEmptyState v-if="loadError != null" title="Couldn't load" :description="loadError.message">
    <template #action>
      <UiButton variant="secondary" @click="reload">Retry</UiButton>
    </template>
  </UiEmptyState>

  <div v-else-if="trip != null" class="flex flex-col gap-4">
    <UiPageHeader title="Receive return" :subtitle="`Loaded ${formatDateTime(trip.loadedAt)}`" :back="ROUTES.CASHIER.TRIPS.INDEX">
      <template #actions>
        <UiStatusPill :tone="TRIP_STATUS_TONE[trip.status]">{{ TRIP_STATUS_LABEL[trip.status] }}</UiStatusPill>
        <UiButton v-if="isReceivable" :loading="isRunning" @click="submit">Submit return</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="!isReceivable" title="Not ready to receive" description="Only trips the rider has ended can be received.">
      <template #action>
        <UiButton :to="ROUTES.CASHIER.TRIPS.INDEX">Back to trips</UiButton>
      </template>
    </UiEmptyState>

    <template v-else>
      <UiCard v-for="line in trip.lines" :key="line.productId" :title="line.productName">
        <p class="text-sm text-zinc-500">Loaded {{ line.loaded }}, expected {{ line.expectedFull }} full, {{ line.emptiesCollected }} empty</p>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <UiStepper
            label="Full returned"
            :model-value="counted[line.productId]?.full ?? 0"
            :min="0"
            :max="line.loaded"
            @update:model-value="(value) => setFull(line.productId, value)"
          />
          <UiStepper
            label="Empties returned"
            :model-value="counted[line.productId]?.empty ?? 0"
            :min="0"
            :max="line.loaded"
            @update:model-value="(value) => setEmpty(line.productId, value)"
          />
        </div>
      </UiCard>

      <UiCard title="Cash">
        <p class="text-sm text-zinc-500">Expected <UiMoneyText :centavos="trip.expectedCash" size="sm" /></p>
        <UiMoneyPad v-model="cashAmount" class="mt-2" :suggestion="trip.expectedCash" />
      </UiCard>

      <p v-if="error != null" role="alert" class="text-sm text-red-700">
        {{ error.message }}
        <RouterLink v-if="isDrawerClosed" :to="ROUTES.CASHIER.INDEX" class="underline">Open the drawer</RouterLink>
      </p>
    </template>
  </div>

  <UiPageHeader v-else-if="isLoading" title="Receive return" :back="ROUTES.CASHIER.TRIPS.INDEX" />
</template>
