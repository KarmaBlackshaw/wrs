<script setup lang="ts">
import { containerHoldings } from "@/mocks/containers";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Daily count" } });

const router = useRouter();
const toast = useToast();

const stationHoldings = containerHoldings.filter((holding) => holding.location === "station");

const counted = ref<Record<string, { full: number; empty: number }>>(
  Object.fromEntries(stationHoldings.map((holding) => [holding.type, { full: holding.full, empty: holding.empty }]))
);

function setFull(type: string, qty: number) {
  const entry = counted.value[type];

  if (entry) {
    entry.full = qty;
  }
}

function setEmpty(type: string, qty: number) {
  const entry = counted.value[type];

  if (entry) {
    entry.empty = qty;
  }
}

function variance(type: string, field: "full" | "empty") {
  const holding = stationHoldings.find((candidate) => candidate.type === type);

  return (counted.value[type]?.[field] ?? 0) - (holding?.[field] ?? 0);
}

function submit() {
  toast.show("Saved");
  router.push(ROUTES.CASHIER.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Daily count" subtitle="Count round and slim containers against expected station holdings.">
      <template #actions>
        <UiButton @click="submit">Submit count</UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-for="holding in stationHoldings" :key="holding.type" :title="holding.type === 'round' ? 'Round' : 'Slim'">
      <p class="text-sm text-zinc-500">Expected {{ holding.full }} full, {{ holding.empty }} empty</p>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <UiStepper
            label="Full counted"
            :model-value="counted[holding.type]?.full ?? 0"
            :min="0"
            :max="999"
            @update:model-value="(value) => setFull(holding.type, value)"
          />
          <UiVariancePill class="mt-2" :value="variance(holding.type, 'full')" />
        </div>
        <div>
          <UiStepper
            label="Empty counted"
            :model-value="counted[holding.type]?.empty ?? 0"
            :min="0"
            :max="999"
            @update:model-value="(value) => setEmpty(holding.type, value)"
          />
          <UiVariancePill class="mt-2" :value="variance(holding.type, 'empty')" />
        </div>
      </div>
    </UiCard>
  </div>
</template>
