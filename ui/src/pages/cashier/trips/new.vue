<script setup lang="ts">
import { listHoldings } from "@/services/container";
import { listEmployeeOptions } from "@/services/employee";
import { loadOutTrip } from "@/services/trip";
import { ROUTES } from "@/types";

definePage({ meta: { title: "New load-out" } });

const router = useRouter();
const toast = useToast();
const confirmDialog = useConfirm();
const productStore = useProductStore();
const containerTypeStore = useContainerTypeStore();
const { products } = storeToRefs(productStore);
const { types: containerTypes } = storeToRefs(containerTypeStore);

productStore.load();
containerTypeStore.load();

const {
  data: riders,
  isLoading: isLoadingRiders,
  error: ridersError,
  reload: reloadRiders,
} = useResource((signal) => listEmployeeOptions({ role: "rider", scope: "available_for_trip" }, signal));

const {
  data: holdings,
  isLoading: isLoadingHoldings,
  error: holdingsError,
  reload: reloadHoldings,
} = useResource((signal) => listHoldings({ locationKind: "station", pageSize: 100 }, signal));
const { run, isRunning, error } = useAction(loadOutTrip, { inline: ["trip.open_exists", "container.station_short", "product.not_deliverable", "validation"] });

const riderId = ref<string>();
const load = ref<Record<string, number>>({});

const riderOptions = computed(() => (riders.value ?? []).map(({ id, name }) => ({ value: id, label: name })));
const deliverableCodes = computed(() => containerTypes.value.filter(({ deliverable }) => deliverable).map(({ code }) => code));

const deliverableProducts = computed(() =>
  products.value.filter(
    ({ active, kind, containerType }) => active && kind === "refill" && containerType != null && deliverableCodes.value.includes(containerType)
  )
);

watch(riders, (list) => {
  if (riderId.value == null || !list?.some(({ id }) => id === riderId.value)) {
    riderId.value = list?.[0]?.id;
  }
});

function qtyFor(productId: string) {
  return load.value[productId] ?? 0;
}

function setQty(productId: string, qty: number) {
  load.value[productId] = qty;
}

function availableFor(containerType: string | null) {
  const holding = holdings.value?.items.find((item) => item.containerType === containerType);

  return (holding?.full ?? 0) + (holding?.empty ?? 0);
}

function maxFor({ id, containerType }: { id: string; containerType: string | null }) {
  const others = deliverableProducts.value
    .filter((product) => product.id !== id && product.containerType === containerType)
    .reduce((sum, product) => sum + qtyFor(product.id), 0);

  return Math.max(0, availableFor(containerType) - others);
}

const loadedLines = computed(() => deliverableProducts.value.filter((product) => qtyFor(product.id) > 0));
const isOverStock = computed(() => loadedLines.value.some((product) => qtyFor(product.id) > maxFor(product)));
const canConfirm = computed(() => riderId.value != null && loadedLines.value.length > 0 && !isOverStock.value);
const errorMessage = computed(() => error.value?.message);

async function confirm() {
  const selectedId = riderId.value;

  if (!canConfirm.value || selectedId == null) {
    return;
  }

  const riderName = riderOptions.value.find(({ value }) => value === selectedId)?.label;

  const isConfirmed = await confirmDialog.confirm({
    title: "Confirm load-out",
    message: [`Rider: ${riderName}`, ...loadedLines.value.map((product) => `${product.name} x ${qtyFor(product.id)}`)].join("\n"),
    confirmLabel: "Load out",
  });

  if (!isConfirmed) {
    return;
  }

  await run({ riderId: selectedId, lines: loadedLines.value.map((product) => ({ productId: product.id, loaded: qtyFor(product.id) })) });

  if (error.value != null) {
    return;
  }

  toast.show("Trip loaded out");
  router.push(ROUTES.CASHIER.TRIPS.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="New load-out" :back="ROUTES.CASHIER.TRIPS.INDEX">
      <template #actions>
        <UiButton :disabled="!canConfirm" :loading="isRunning" @click="confirm">Confirm load-out</UiButton>
      </template>
    </UiPageHeader>

    <UiEmptyState v-if="ridersError != null" title="Couldn't load" :description="ridersError.message">
      <template #action><UiButton variant="secondary" @click="reloadRiders">Retry</UiButton></template>
    </UiEmptyState>
    <UiEmptyState v-else-if="riders != null && riders.length === 0" title="No riders available" description="Every rider already has an open trip." />
    <UiSelect v-else v-model="riderId" label="Rider" :options="riderOptions" :placeholder="isLoadingRiders ? 'Loading…' : 'Select a rider'" />

    <p class="text-sm text-zinc-500">Only containers riders can deliver are listed.</p>

    <UiEmptyState v-if="holdingsError != null" title="Couldn't load" :description="holdingsError.message">
      <template #action><UiButton variant="secondary" @click="reloadHoldings">Retry</UiButton></template>
    </UiEmptyState>
    <template v-else-if="holdings != null">
      <UiCard v-for="product in deliverableProducts" :key="product.id" :title="product.name">
        <div class="flex items-center justify-between gap-3">
          <UiStepper :model-value="qtyFor(product.id)" :min="0" :max="maxFor(product)" @update:model-value="(value) => setQty(product.id, value)" />
          <span class="text-sm text-zinc-500">{{ availableFor(product.containerType) }} in stock</span>
        </div>
      </UiCard>
    </template>
    <p v-else-if="isLoadingHoldings" class="text-sm text-zinc-500">Loading stock…</p>

    <p v-if="errorMessage" role="alert" class="text-sm font-medium text-red-700">{{ errorMessage }}</p>
  </div>
</template>
