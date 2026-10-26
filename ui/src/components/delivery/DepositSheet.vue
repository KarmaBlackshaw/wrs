<script setup lang="ts">
import type { TDepositSubBody } from "@wrs/contract/deposit";
import type { TPaymentMethod } from "@wrs/contract/payment";

const open = defineModel<boolean>("open", { default: false });

const { lines } = defineProps<{
  lines: TDepositSubBody["lines"];
}>();

const emit = defineEmits<{ submit: [deposit: TDepositSubBody] }>();

const amountDraft = ref(0);
const methodDraft = ref<TPaymentMethod>("cash");
const saveBlockReasonId = useId();

const due = computed(() => lines.reduce((sum, { amount }) => sum + amount, 0));

watch(open, (isOpen) => {
  if (isOpen) {
    amountDraft.value = due.value;
    methodDraft.value = "cash";
  }
});

const saveBlockReason = computed(() => (amountDraft.value < due.value ? `Collect at least ${formatMoney(due.value)}.` : undefined));
const saveDescribedBy = computed(() => (saveBlockReason.value != null ? saveBlockReasonId : undefined));

function submit() {
  if (saveBlockReason.value != null || lines.length === 0) {
    return;
  }

  const extra = amountDraft.value - due.value;

  emit("submit", { method: methodDraft.value, lines: lines.map((line, index) => (index === 0 ? { ...line, amount: line.amount + extra } : line)) });
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect deposit">
    <div class="flex flex-col gap-4">
      <p class="text-base text-zinc-700">Collect a deposit for the borrowed containers before confirming.</p>
      <ul class="flex flex-col gap-1 text-sm text-zinc-600">
        <li v-for="line in lines" :key="line.containerType" class="flex justify-between gap-3">
          <span>{{ CONTAINER_TYPE_LABEL[line.containerType] }} × {{ line.qty }}</span>
          <UiMoneyText :centavos="line.amount" size="sm" />
        </li>
      </ul>
      <UiSegmentedControl v-model="methodDraft" label="Paid by" :options="PAYMENT_METHOD_OPTIONS" />
      <UiMoneyPad v-model="amountDraft" :suggestion="due" />
    </div>
    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="saveBlockReason != null" :id="saveBlockReasonId" class="text-sm text-zinc-600">{{ saveBlockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :disabled="saveBlockReason != null" :aria-describedby="saveDescribedBy" @click="submit">Collect deposit</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
