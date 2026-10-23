<script setup lang="ts">
import type { TContainerTypeCode, TOption, TPrice, TProduct, TProductKind } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  submit: [value: { product: Omit<TProduct, "id">; price: Omit<TPrice, "productId"> }];
}>();

const toast = useToast();

const kindOptions: TOption<TProductKind>[] = [
  { value: "refill", label: "Refill" },
  { value: "container", label: "Container" },
  { value: "bottled", label: "Bottled" },
  { value: "other", label: "Other" },
];

const containerTypeOptions: TOption<TContainerTypeCode>[] = [
  { value: "round", label: "Round" },
  { value: "slim", label: "Slim" },
];

const newName = ref("");
const newKind = ref<TProductKind>("refill");
const newContainerType = ref<TContainerTypeCode>("round");
const newPrice = ref("");

const needsContainerType = computed(() => newKind.value === "refill" || newKind.value === "container");
const canAddProduct = computed(() => newName.value.trim().length > 0 && Number(newPrice.value) > 0);

function submitAddProduct() {
  if (!canAddProduct.value) {
    return;
  }

  emit("submit", {
    product: {
      name: newName.value.trim(),
      kind: newKind.value,
      containerType: needsContainerType.value ? newContainerType.value : undefined,
      active: true,
    },
    price: { amount: Math.round(Number(newPrice.value) * 100), effectiveFrom: todayIso() },
  });

  newName.value = "";
  newPrice.value = "";
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add product">
    <div class="flex flex-col gap-4">
      <UiField v-model="newName" label="Product name" />
      <UiSelect v-model="newKind" label="Kind" :options="kindOptions" />
      <UiSelect v-if="needsContainerType" v-model="newContainerType" label="Container type" :options="containerTypeOptions" />
      <UiField v-model="newPrice" label="Price (₱)" type="number" inputmode="decimal" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canAddProduct" @click="submitAddProduct">Save product</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
