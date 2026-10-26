<script setup lang="ts">
import type { TConsumable } from "@wrs/contract/consumable";

import { putConsumableUsages } from "@/services/consumable";

const consumable = defineModel<TConsumable>("consumable");

const emit = defineEmits<{
  submit: [];
}>();

const productStore = useProductStore();
const { products } = storeToRefs(productStore);
const toast = useToast();
const { run, isRunning, error } = useAction(putConsumableUsages, { inline: ["validation", "reference.not_found"] });

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const usageDrafts = ref<{ productId: string; productName: string; qty?: number }[]>([]);
const pickedProductId = ref<string>();

const productOptions = computed(() =>
  products.value.filter(({ id }) => !usageDrafts.value.some(({ productId }) => productId === id)).map(({ id, name }) => ({ value: id, label: name }))
);

const blockReason = computed(() => {
  if (usageDrafts.value.some(({ qty }) => qty == null || qty <= 0)) {
    return "Enter a quantity above zero for every product.";
  }

  return undefined;
});

watch(open, async (isOpen) => {
  if (!isOpen) {
    return;
  }

  usageDrafts.value = (consumable.value?.usages ?? []).map(({ productId, productName, qty }) => ({ productId, productName, qty }));
  pickedProductId.value = undefined;
  await productStore.load();
});

function addProduct() {
  const product = products.value.find(({ id }) => id === pickedProductId.value);

  if (product == null) {
    return;
  }

  usageDrafts.value.push({ productId: product.id, productName: product.name });
  pickedProductId.value = undefined;
}

function removeProduct(productId: string) {
  usageDrafts.value = usageDrafts.value.filter((draft) => draft.productId !== productId);
}

async function submit() {
  if (consumable.value == null) {
    return;
  }

  const usages = usageDrafts.value.flatMap(({ productId, qty }) => (qty == null ? [] : [{ productId, qty }]));

  await run({ id: consumable.value.id, body: { usages } });

  if (error.value != null) {
    return;
  }

  emit("submit");
  consumable.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit usage list">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ consumable?.name }}, quantity used per unit sold</p>
      <div v-for="draft in usageDrafts" :key="draft.productId" class="flex items-end gap-3">
        <div class="min-w-0 flex-1">
          <UiNumberField v-model="draft.qty" :label="draft.productName" :min="0" :is-integer="false" />
        </div>
        <UiButton variant="secondary" :aria-label="`Remove ${draft.productName}`" @click="removeProduct(draft.productId)">
          <IconX class="size-4" />
        </UiButton>
      </div>
      <p v-if="usageDrafts.length === 0" class="text-sm text-zinc-400">No products use this consumable yet.</p>
      <div v-if="productOptions.length > 0" class="flex items-end gap-3">
        <div class="min-w-0 flex-1">
          <UiSelect v-model="pickedProductId" label="Add product" placeholder="Choose a product" :options="productOptions" />
        </div>
        <UiButton variant="secondary" :disabled="pickedProductId == null" @click="addProduct">Add</UiButton>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="usage-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'usage-block-reason' : undefined"
            @click="submit"
            >Save usage list</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
