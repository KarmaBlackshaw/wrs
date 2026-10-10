<script setup lang="ts">
import { ROUTES } from "@/types";

definePage({ meta: { title: "Receive return" } });

const { productName } = useProductLookup();

const route = useRoute<"/cashier/trips/[id]/receive">();
const router = useRouter();
const toast = useToast();

const summary = tripSummary(route.params.id);

const counted = ref<Record<string, { full: number; empty: number }>>(
  Object.fromEntries(
    summary.perProduct.map((line) => [line.productId, { full: line.returnedFull || line.expectedFull, empty: line.returnedEmpty || line.emptiesCollected }])
  )
);

const cashAmount = ref(0);

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

function submit() {
  toast.show("Saved");
  router.push(ROUTES.CASHIER.TRIPS.INDEX);
}
</script>

<template>
  <UiEmptyState v-if="!summary.trip" title="Trip not found" description="It may have been reconciled or removed.">
    <template #action>
      <UiButton :to="ROUTES.CASHIER.TRIPS.INDEX">Back to trips</UiButton>
    </template>
  </UiEmptyState>

  <div v-else class="flex flex-col gap-4">
    <UiPageHeader title="Receive return" :subtitle="`Loaded ${formatDateTime(summary.trip.loadedAt)}`" :back="ROUTES.CASHIER.TRIPS.INDEX">
      <template #actions>
        <UiButton @click="submit">Submit return</UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-for="line in summary.perProduct" :key="line.productId" :title="productName(line.productId)">
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
      <p class="text-sm text-zinc-500">Expected <UiMoneyText :centavos="summary.expectedCash" size="sm" /></p>
      <UiMoneyPad v-model="cashAmount" class="mt-2" :suggestion="summary.expectedCash" />
    </UiCard>
  </div>
</template>
