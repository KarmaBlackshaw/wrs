<script setup lang="ts">
import type { TPayLine } from "@/types";

const line = defineModel<TPayLine>("line");

const emit = defineEmits<{
  submit: [delta: number];
}>();

const { employeeName } = useEmployeeLookup();
const toast = useToast();

const open = computed({
  get: () => line.value != null,
  set: (isOpen) => {
    if (!isOpen) {
      line.value = undefined;
    }
  },
});

const adjustAmount = ref("");

watch(open, (isOpen) => {
  if (isOpen) {
    adjustAmount.value = "";
  }
});

function submit() {
  if (!line.value || !Number(adjustAmount.value)) {
    return;
  }

  emit("submit", Math.round(Number(adjustAmount.value) * 100));
  line.value = undefined;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Adjust pay line">
    <div class="flex flex-col gap-4">
      <p class="text-sm text-zinc-500">{{ line ? employeeName(line.employeeId) : "" }}</p>
      <UiField v-model="adjustAmount" label="Adjustment amount (₱, use negative to deduct)" type="number" inputmode="decimal" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="submit">Save adjustment</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
