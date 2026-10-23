<script setup lang="ts">
import type { TConsumable, TProductUsage } from "@/types";

const consumable = defineModel<TConsumable>("consumable");

const { usages } = defineProps<{
  usages: TProductUsage[];
}>();

const emit = defineEmits<{
  submit: [consumableId: string, usages: TProductUsage[]];
}>();

const productStore = useProductStore();
const toast = useToast();

const open = computed({
  get: () => consumable.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      consumable.value = undefined;
    }
  },
});

const usageDrafts = ref<{ productId: string; qtyPerUnit: number }[]>([]);

watch(open, (isOpen) => {
  if (isOpen && consumable.value) {
    const { id } = consumable.value;

    usageDrafts.value = usages.filter((usage) => usage.consumableId === id).map((usage) => ({ productId: usage.productId, qtyPerUnit: usage.qtyPerUnit }));
  }
});

function submitUsage() {
  if (!consumable.value) {
    return;
  }

  const consumableId = consumable.value.id;

  emit(
    "submit",
    consumableId,
    usageDrafts.value.map((draft) => ({ consumableId, productId: draft.productId, qtyPerUnit: draft.qtyPerUnit }))
  );

  consumable.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit usage list">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ consumable?.name }}, quantity used per unit sold</p>
      <div v-for="draft in usageDrafts" :key="draft.productId" class="flex items-center justify-between gap-3">
        <span class="text-base text-zinc-700">{{ productStore.productName(draft.productId) }}</span>
        <UiStepper v-model="draft.qtyPerUnit" :min="0" :max="10" />
      </div>
      <p v-if="usageDrafts.length === 0" class="text-sm text-zinc-400">No products use this consumable yet.</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="submitUsage">Save usage list</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
