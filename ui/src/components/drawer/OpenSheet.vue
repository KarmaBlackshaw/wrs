<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { suggestedOpeningCash } = defineProps<{
  suggestedOpeningCash: number;
}>();

const emit = defineEmits<{ submit: [openingCash: number] }>();

const toast = useToast();
const openAmount = ref(0);

function confirmOpen() {
  emit("submit", openAmount.value);
  openAmount.value = 0;
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Open drawer">
    <div class="flex flex-col gap-4">
      <UiMoneyPad v-model="openAmount" :suggestion="suggestedOpeningCash" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmOpen">Confirm opening cash</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
