<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { depositAmount } = defineProps<{
  depositAmount: number;
}>();

const emit = defineEmits<{ submit: [deposit: number] }>();

const depositInput = ref("");

watch(open, (isOpen) => {
  if (isOpen) {
    depositInput.value = "";
  }
});

function confirmDeposit() {
  emit("submit", padToCentavos(depositInput.value));
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect deposit">
    <div class="flex flex-col gap-4">
      <p class="text-base text-zinc-700">Collect a deposit for the borrowed container before confirming.</p>
      <UiMoneyText :centavos="padToCentavos(depositInput)" size="xl" />
      <UiButton variant="ghost" @click="depositInput = String(depositAmount)">Use {{ formatMoney(depositAmount) }}</UiButton>
      <UiNumberPad v-model="depositInput" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmDeposit">Collect deposit</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
