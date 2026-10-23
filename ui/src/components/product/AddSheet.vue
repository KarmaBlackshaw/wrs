<script setup lang="ts">
import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TProduct, TProductKind } from "@wrs/contract/product";

import { createProduct } from "@/services/product";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [product: TProduct];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(createProduct, { inline: ["validation"] });

const name = ref("");
const kind = ref<TProductKind>("refill");
const containerType = ref<TContainerTypeCode>("round");
const price = ref<number>();

const needsContainerType = computed(() => kind.value === "refill" || kind.value === "container");

const blockReason = computed(() => {
  if (name.value.trim().length === 0) {
    return "Enter a product name.";
  }

  return price.value == null || price.value <= 0 ? "Enter a price above zero." : undefined;
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  name.value = "";
  kind.value = "refill";
  containerType.value = "round";
  price.value = undefined;
});

async function submit() {
  if (price.value == null) {
    return;
  }

  const product = await run({
    name: name.value.trim(),
    kind: kind.value,
    containerType: needsContainerType.value ? containerType.value : undefined,
    price: price.value,
  });

  if (error.value != null || product == null) {
    return;
  }

  emit("submit", product);
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add product">
    <div class="flex flex-col gap-4">
      <UiField v-model="name" label="Product name" />
      <UiSelect v-model="kind" label="Kind" :options="PRODUCT_KIND_OPTIONS" />
      <UiSelect v-if="needsContainerType" v-model="containerType" label="Container type" :options="CONTAINER_TYPE_OPTIONS" />
      <UiMoneyField v-model="price" label="Price (₱)" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="add-product-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'add-product-block-reason' : undefined"
            @click="submit"
            >Save product</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
