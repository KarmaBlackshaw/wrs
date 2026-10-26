<script setup lang="ts">
import { closeDrawer } from "@/services/drawer";

const open = defineModel<boolean>("open", { default: false });

const { expected } = defineProps<{
  expected: number;
}>();

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(closeDrawer, { inline: ["drawer.not_open"] });

const countedCash = ref(0);

const variance = computed(() => countedCash.value - expected);

const varianceClass = computed(() => (variance.value === 0 ? "text-emerald-700" : "text-red-700"));

const varianceText = computed(() => formatVariance(variance.value, true));

watch(open, (isOpen) => {
  if (isOpen) {
    countedCash.value = 0;
  }
});

async function submit() {
  await run({ countedCash: countedCash.value });

  if (error.value != null) {
    return;
  }

  emit("submit");
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Close with count">
    <div class="flex flex-col gap-4">
      <UiStatCard label="Expected cash"><UiMoneyText :centavos="expected" size="lg" /></UiStatCard>
      <UiMoneyPad v-model="countedCash" :suggestion="expected" />
      <p class="text-center text-lg font-semibold" :class="varianceClass">{{ varianceText }}</p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :loading="isRunning" @click="submit">Close drawer</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
