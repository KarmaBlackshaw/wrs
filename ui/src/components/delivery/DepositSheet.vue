<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const { depositAmount } = defineProps<{
  depositAmount: number;
}>();

const emit = defineEmits<{ submit: [deposit: number] }>();

const deposit = ref(0);

watch(open, (isOpen) => {
  if (isOpen) {
    deposit.value = 0;
  }
});

function confirmDeposit() {
  emit("submit", deposit.value);
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect deposit">
    <div class="flex flex-col gap-4">
      <p class="text-base text-zinc-700">Collect a deposit for the borrowed container before confirming.</p>
      <UiMoneyPad v-model="deposit" :suggestion="depositAmount" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="confirmDeposit">Collect deposit</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
