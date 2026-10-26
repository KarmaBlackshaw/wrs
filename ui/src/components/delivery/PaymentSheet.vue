<script setup lang="ts">
import type { TPaymentMethod } from "@wrs/contract/payment";

const open = defineModel<boolean>("open", { default: false });

const { customerId, tripId } = defineProps<{
  customerId: string;
  tripId: string;
}>();

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const riderStore = useRiderStore();
const syncStore = useSyncStore();

const amountDraft = ref(0);
const methodDraft = ref<TPaymentMethod>("cash");
const isSaving = ref(false);
const saveBlockReasonId = useId();

const customer = computed(() => riderStore.customer(customerId));
const balance = computed(() => customer.value?.creditBalance ?? 0);

watch(open, (isOpen) => {
  if (isOpen) {
    amountDraft.value = 0;
    methodDraft.value = "cash";
  }
});

const saveBlockReason = computed(() => {
  if (amountDraft.value <= 0) {
    return "Enter the amount collected.";
  }

  if (amountDraft.value > balance.value) {
    return `Payment can't be more than the balance of ${formatMoney(balance.value)}.`;
  }

  return undefined;
});

const saveDescribedBy = computed(() => (saveBlockReason.value != null ? saveBlockReasonId : undefined));

async function submit() {
  if (saveBlockReason.value != null) {
    return;
  }

  isSaving.value = true;

  try {
    const id = crypto.randomUUID();

    await syncStore.enqueue({ kind: "payment.create", opId: id, payload: { id, customerId, tripId, amount: amountDraft.value, method: methodDraft.value } });
  } catch (error) {
    console.error(error);
    toast.show("Couldn't save the payment on this device");

    return;
  } finally {
    isSaving.value = false;
  }

  toast.show("Payment saved");
  emit("submit");
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Collect payment">
    <div class="flex flex-col gap-4">
      <p v-if="customer != null" class="text-base text-zinc-700">
        Credit balance for {{ fullName(customer) }}
        <UiMoneyText :centavos="balance" size="sm" tone="warn" />
      </p>
      <UiSegmentedControl v-model="methodDraft" label="Paid by" :options="PAYMENT_METHOD_OPTIONS" />
      <UiMoneyPad v-model="amountDraft" :suggestion="balance" />
    </div>
    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="saveBlockReason != null" :id="saveBlockReasonId" class="text-sm text-zinc-600">{{ saveBlockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :disabled="saveBlockReason != null" :aria-describedby="saveDescribedBy" :loading="isSaving" @click="submit">
            Record payment
          </UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
