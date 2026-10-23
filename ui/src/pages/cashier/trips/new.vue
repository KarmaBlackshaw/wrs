<script setup lang="ts">
import { products } from "@/mocks/products";
import { ROUTES } from "@/types";

definePage({ meta: { title: "New load-out" } });

const router = useRouter();
const toast = useToast();

const { riders, riderOptions } = storeToRefs(useEmployeeStore());
const roundRefills = products.filter((product) => product.active && product.kind === "refill" && product.containerType === "round");

const riderId = ref(riders.value[0]?.id ?? "");
const load = ref<Record<string, number>>({});

function qtyFor(productId: string) {
  return load.value[productId] ?? 0;
}

function setQty(productId: string, qty: number) {
  load.value[productId] = qty;
}

const canConfirm = computed(() => riderId.value !== "" && roundRefills.some((product) => qtyFor(product.id) > 0));

function confirm() {
  if (!canConfirm.value) {
    return;
  }

  toast.show("Saved");
  router.push(ROUTES.CASHIER.TRIPS.INDEX);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiPageHeader title="New load-out" :back="ROUTES.CASHIER.TRIPS.INDEX">
      <template #actions>
        <UiButton :disabled="!canConfirm" @click="confirm">Confirm load-out</UiButton>
      </template>
    </UiPageHeader>

    <UiSelect v-model="riderId" label="Rider" :options="riderOptions" />

    <p class="text-sm text-zinc-500">Slim containers aren't offered on trips, round only (BR-01).</p>

    <UiCard v-for="product in roundRefills" :key="product.id" :title="product.name">
      <UiStepper :model-value="qtyFor(product.id)" :min="0" :max="200" @update:model-value="(value) => setQty(product.id, value)" />
    </UiCard>
  </div>
</template>
