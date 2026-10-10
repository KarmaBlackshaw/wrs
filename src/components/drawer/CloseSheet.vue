<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { expectedCash } = defineProps<{
  expectedCash: number;
}>();

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const countPad = ref("");

const countedCash = computed(() => padToCentavos(countPad.value));

const variance = computed(() => countedCash.value - expectedCash);

const varianceTone = computed(() => (variance.value === 0 ? "ok" : "danger"));

const varianceText = computed(() => {
  if (variance.value === 0) {
    return "Exact match";
  }

  return variance.value > 0 ? `Over ${formatMoney(variance.value)}` : `Short ${formatMoney(Math.abs(variance.value))}`;
});

function confirmClose() {
  emit("submit");
  open.value = false;
  countPad.value = "";
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Close with count">
    <div class="flex flex-col gap-4">
      <UiStatCard label="Expected cash"><UiMoneyText :centavos="expectedCash" size="lg" /></UiStatCard>
      <p class="text-center"><UiMoneyText :centavos="countedCash" size="xl" /></p>
      <UiButton variant="ghost" @click="countPad = String(expectedCash)">Use {{ formatMoney(expectedCash) }}</UiButton>
      <UiNumberPad v-model="countPad" />
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
