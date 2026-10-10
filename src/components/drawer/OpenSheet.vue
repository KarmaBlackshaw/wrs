<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { suggestedOpeningCash } = defineProps<{
  suggestedOpeningCash: number;
}>();

const emit = defineEmits<{ submit: [openingCash: number] }>();

const toast = useToast();
const openPad = ref("");

const openAmount = computed(() => padToCentavos(openPad.value));

function confirmOpen() {
  emit("submit", openAmount.value);
  openPad.value = "";
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Open drawer">
    <div class="flex flex-col gap-4">
      <p class="text-center"><UiMoneyText :centavos="openAmount" size="xl" /></p>
      <UiButton v-if="suggestedOpeningCash > 0" variant="ghost" @click="openPad = String(suggestedOpeningCash)">
        Use {{ formatMoney(suggestedOpeningCash) }}
      </UiButton>
      <UiNumberPad v-model="openPad" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmOpen">Confirm opening cash</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
