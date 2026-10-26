<script setup lang="ts">
import type { THolding, TContainerTypeCode } from "@wrs/contract/container";

import { createCounts, listHoldings } from "@/services/container";
import { ROUTES } from "@/types";

definePage({ meta: { title: "Daily count" } });

type TCount = Pick<THolding, "full" | "empty">;
type TCountField = keyof TCount;

const router = useRouter();
const toast = useToast();
const containerTypeStore = useContainerTypeStore();
const { types } = storeToRefs(containerTypeStore);

containerTypeStore.load();

const { data: holdings, error, isLoading, reload } = useResource((signal) => listHoldings({ locationKind: "station" }, signal));
const { run, isRunning } = useAction(createCounts);

const counted = ref<Partial<Record<TContainerTypeCode, TCount>>>({});

watch(holdings, (page) => {
  if (page == null) {
    return;
  }

  counted.value = {};

  for (const { containerType, full, empty } of page.items) {
    counted.value[containerType] = { full, empty };
  }
});

function countOf(code: TContainerTypeCode): TCount {
  return counted.value[code] ?? { full: 0, empty: 0 };
}

function expectedOf(code: TContainerTypeCode, field: TCountField) {
  const holding = holdings.value?.items.find((candidate) => candidate.containerType === code);

  return holding?.[field] ?? 0;
}

function setCount(code: TContainerTypeCode, field: TCountField, qty: number) {
  counted.value[code] = { ...countOf(code), [field]: qty };
}

function variance(code: TContainerTypeCode, field: TCountField) {
  return countOf(code)[field] - expectedOf(code, field);
}

async function submit() {
  const saved = await run({
    counts: types.value.map(({ code }) => ({ containerType: code, ...countOf(code) })),
  });

  if (saved == null) {
    return;
  }

  toast.show("Saved");
  router.push(ROUTES.CASHIER.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="Daily count" subtitle="Count round and slim containers against expected station holdings.">
      <template #actions>
        <UiButton :loading="isRunning" :disabled="holdings == null" @click="submit">Submit count</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="error != null" title="Couldn't load" :description="error.message">
      <template #action>
        <UiButton variant="secondary" @click="reload">Retry</UiButton>
      </template>
    </UiEmptyState>

    <template v-else-if="holdings != null">
      <UiCard v-for="type in types" :key="type.code" :title="CONTAINER_TYPE_LABEL[type.code]">
        <p class="text-sm text-zinc-500">Expected {{ expectedOf(type.code, "full") }} full, {{ expectedOf(type.code, "empty") }} empty</p>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <UiStepper
              label="Full counted"
              :model-value="countOf(type.code).full"
              :min="0"
              :max="999"
              @update:model-value="(value) => setCount(type.code, 'full', value)"
            />
            <UiVariancePill class="mt-2" :value="variance(type.code, 'full')" />
          </div>
          <div>
            <UiStepper
              label="Empty counted"
              :model-value="countOf(type.code).empty"
              :min="0"
              :max="999"
              @update:model-value="(value) => setCount(type.code, 'empty', value)"
            />
            <UiVariancePill class="mt-2" :value="variance(type.code, 'empty')" />
          </div>
        </div>
      </UiCard>
    </template>

    <p v-else-if="isLoading" class="text-sm text-zinc-500">Loading…</p>
  </div>
</template>
