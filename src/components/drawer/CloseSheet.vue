<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { expectedCash } = defineProps<{
  expectedCash: number;
}>();

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const countedCash = ref(0);

const variance = computed(() => countedCash.value - expectedCash);

const varianceTone = computed(() => (variance.value === 0 ? "ok" : "danger"));

const varianceText = computed(() => formatVariance(variance.value, true));

function confirmClose() {
  emit("submit");
  open.value = false;
  countedCash.value = 0;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Close with count">
    <div class="flex flex-col gap-4">
      <UiStatCard label="Expected cash"><UiMoneyText :centavos="expectedCash" size="lg" /></UiStatCard>
      <UiMoneyPad v-model="countedCash" :suggestion="expectedCash" />
      <p class="text-center text-lg font-semibold" :class="varianceTone === 'ok' ? 'text-emerald-700' : 'text-red-700'">
        {{ varianceText }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmClose">Close drawer</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
