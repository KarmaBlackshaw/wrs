<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { DELIVERY_INTERVAL_DAYS } from "@wrs/contract/rules/customerLimits";

import { updateCustomer } from "@/services/customer";

const customer = defineModel<TCustomer>("customer");

const emit = defineEmits<{
  submit: [customer: TCustomer];
}>();

const employeeStore = useEmployeeStore();
const { riderOptions } = storeToRefs(employeeStore);
const toast = useToast();
const { run, isRunning, error } = useAction(updateCustomer, { inline: ["customer.duplicate_phone", "validation"] });

const isOpen = computed({
  get: () => customer.value != null,
  set: (value) => {
    if (!value) {
      customer.value = undefined;
    }
  },
});

const firstNameDraft = ref("");
const lastNameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const riderDraft = ref("");
const intervalDraft = ref<number>();
const reasonId = useId();

const riderDraftOptions = computed(() => [{ value: "", label: "Open" }, ...riderOptions.value]);

const hasIntervalError = computed(
  () =>
    intervalDraft.value != null &&
    (!Number.isInteger(intervalDraft.value) || intervalDraft.value < DELIVERY_INTERVAL_DAYS.min || intervalDraft.value > DELIVERY_INTERVAL_DAYS.max)
);

const intervalError = computed(() =>
  hasIntervalError.value ? `Enter a whole number from ${DELIVERY_INTERVAL_DAYS.min} to ${DELIVERY_INTERVAL_DAYS.max}` : undefined
);

const blockReason = computed(() => {
  if (hasIntervalError.value) {
    return intervalError.value;
  }

  const hasEmptyField = [firstNameDraft, lastNameDraft, phoneDraft, addressDraft].some((draft) => draft.value.trim().length === 0);

  return hasEmptyField ? "Name, phone and address are required" : undefined;
});

watch(isOpen, async (value) => {
  if (!value || customer.value == null) {
    return;
  }

  const { firstName, lastName, phone, address, riderId, deliveryIntervalDays } = customer.value;

  firstNameDraft.value = firstName;
  lastNameDraft.value = lastName;
  phoneDraft.value = phone;
  addressDraft.value = address;
  riderDraft.value = riderId ?? "";
  intervalDraft.value = deliveryIntervalDays ?? undefined;

  await employeeStore.load();
});

async function submit() {
  if (customer.value == null) {
    return;
  }

  const updated = await run({
    id: customer.value.id,
    body: {
      firstName: firstNameDraft.value.trim(),
      lastName: lastNameDraft.value.trim(),
      phone: phoneDraft.value.trim(),
      address: addressDraft.value.trim(),
      riderId: riderDraft.value || null,
      deliveryIntervalDays: intervalDraft.value,
    },
  });

  if (error.value != null || updated == null) {
    return;
  }

  toast.show("Customer saved");
  emit("submit", updated);
  customer.value = undefined;
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Edit customer">
    <div class="flex flex-col gap-4">
      <UiField v-model="firstNameDraft" label="First name" />
      <UiField v-model="lastNameDraft" label="Last name" />
      <UiField v-model="phoneDraft" label="Phone" type="tel" :error="error?.code === 'customer.duplicate_phone' ? error.message : undefined" />
      <UiField v-model="addressDraft" label="Address" />
      <UiSelect v-model="riderDraft" label="Rider" :options="riderDraftOptions" />
      <UiNumberField
        v-model="intervalDraft"
        label="Delivery interval (days)"
        :min="DELIVERY_INTERVAL_DAYS.min"
        :max="DELIVERY_INTERVAL_DAYS.max"
        :error="intervalError"
      />
      <p v-if="error != null && error.code !== 'customer.duplicate_phone'" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="blockReason != null" :id="reasonId" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :aria-describedby="blockReason != null ? reasonId : undefined"
            :loading="isRunning"
            @click="submit"
            >Save</UiButton
          >
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
