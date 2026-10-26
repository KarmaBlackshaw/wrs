<script setup lang="ts">
import type { TContainerTypeCode } from "@wrs/contract/container";
import type { TProduct, TProductKind } from "@wrs/contract/product";

import { updateProduct } from "@/services/product";

const product = defineModel<TProduct>("product");

const emit = defineEmits<{
  submit: [product: TProduct];
}>();

const toast = useToast();
const { run, isRunning, error } = useAction(updateProduct, { inline: ["validation"] });

const name = ref("");
const kind = ref<TProductKind>("refill");
const containerType = ref<TContainerTypeCode>("round");
const isActive = ref(true);

const isOpen = computed({
  get: () => product.value != null,
  set: (value) => {
    if (!value) {
      product.value = undefined;
    }
  },
});

const needsContainerType = computed(() => kind.value === "refill" || kind.value === "container");
const blockReason = computed(() => (name.value.trim().length === 0 ? "Enter a product name." : undefined));

watch(product, (current) => {
  if (current == null) {
    return;
  }

  name.value = current.name;
  kind.value = current.kind;
  containerType.value = current.containerType ?? "round";
  isActive.value = current.active;
});

async function submit() {
  if (product.value == null) {
    return;
  }

  const updated = await run({
    id: product.value.id,
    body: {
      name: name.value.trim(),
      kind: kind.value,
      containerType: needsContainerType.value ? containerType.value : null,
      active: isActive.value,
    },
  });

  if (error.value != null || updated == null) {
    return;
  }

  emit("submit", updated);
  product.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Edit product">
    <div class="flex flex-col gap-4">
      <UiField v-model="name" label="Product name" />
      <UiSelect v-model="kind" label="Kind" :options="PRODUCT_KIND_OPTIONS" />
      <UiSelect v-if="needsContainerType" v-model="containerType" label="Container type" :options="CONTAINER_TYPE_OPTIONS" />
      <UiCheckbox v-model="isActive" label="Active" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" id="edit-product-block-reason" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :loading="isRunning"
            :aria-describedby="blockReason != null ? 'edit-product-block-reason' : undefined"
            @click="submit"
            >Save changes</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
