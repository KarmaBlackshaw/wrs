<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";
import { DELIVERY_INTERVAL_DAYS } from "@wrs/contract/rules/customerLimits";

import { createCustomer } from "@/services/customer";
import { ROUTES } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { isRiderMode = false } = defineProps<{
  isRiderMode?: boolean;
}>();

const emit = defineEmits<{
  submit: [customer: TCustomer];
}>();

const toast = useToast();
const confirmDialog = useConfirm();
const syncStore = useSyncStore();
const employeeStore = useEmployeeStore();
const { riderOptions } = storeToRefs(employeeStore);
const { run, isRunning, error } = useAction(createCustomer, { inline: ["validation", "customer.duplicate_phone", "customer.duplicate_name"] });

const firstNameDraft = ref("");
const lastNameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const riderDraft = ref<string>();
const intervalDraft = ref<number>();
const hasAttempted = ref(false);
const isEnqueuing = ref(false);
const clientId = ref(crypto.randomUUID());
const saveBlockReasonId = useId();

watch(open, (isOpen) => {
  if (isOpen) {
    reset();

    if (!isRiderMode) {
      void employeeStore.load();
    }
  }
});

const isIntervalValid = computed(
  () =>
    (intervalDraft.value == null && !isRiderMode) ||
    (intervalDraft.value != null &&
      Number.isInteger(intervalDraft.value) &&
      intervalDraft.value >= DELIVERY_INTERVAL_DAYS.min &&
      intervalDraft.value <= DELIVERY_INTERVAL_DAYS.max)
);

const saveBlockReason = computed(() => {
  if (![firstNameDraft, lastNameDraft, phoneDraft, addressDraft].every((draft) => draft.value.trim().length > 0)) {
    return "Enter first name, last name, phone and address.";
  }

  if (!isIntervalValid.value) {
    return `Delivery interval must be a whole number from ${DELIVERY_INTERVAL_DAYS.min} to ${DELIVERY_INTERVAL_DAYS.max} days.`;
  }

  return undefined;
});

const saveDescribedBy = computed(() => (saveBlockReason.value != null ? saveBlockReasonId : undefined));
const intervalLabel = isRiderMode ? "Delivery interval (days), required" : "Delivery interval (days)";
const intervalHint = `${isRiderMode ? "Required" : "Optional"}, ${DELIVERY_INTERVAL_DAYS.min} to ${DELIVERY_INTERVAL_DAYS.max}`;
const isSaving = computed(() => isRunning.value || isEnqueuing.value);
const shownError = computed(() => (hasAttempted.value ? error.value : undefined));
const formErrorMessage = computed(() => (shownError.value?.code === "validation" ? shownError.value.message : undefined));
const phoneErrorMessage = computed(() => (shownError.value?.code === "customer.duplicate_phone" ? shownError.value.message : undefined));

const duplicatePhoneCustomerId = computed(() => {
  const customerId = shownError.value?.code === "customer.duplicate_phone" ? shownError.value.details?.customerId : undefined;

  return typeof customerId === "string" ? customerId : undefined;
});

function isDuplicateMatch(match: unknown): match is { address: string; phone: string } {
  return (
    typeof match === "object" && match != null && "address" in match && typeof match.address === "string" && "phone" in match && typeof match.phone === "string"
  );
}

function duplicateNameLines(details?: Record<string, unknown>) {
  const matches = details?.matches;

  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(isDuplicateMatch).map(({ address, phone }) => `- ${address} (${phone})`);
}

function reset() {
  firstNameDraft.value = "";
  lastNameDraft.value = "";
  phoneDraft.value = "";
  addressDraft.value = "";
  riderDraft.value = undefined;
  intervalDraft.value = undefined;
  hasAttempted.value = false;
  clientId.value = crypto.randomUUID();
}

async function enqueueCreate() {
  const { value: deliveryIntervalDays } = intervalDraft;

  if (deliveryIntervalDays == null) {
    return;
  }

  isEnqueuing.value = true;

  try {
    await syncStore.enqueue({
      kind: "customer.create",
      opId: clientId.value,
      payload: {
        id: clientId.value,
        firstName: firstNameDraft.value.trim(),
        lastName: lastNameDraft.value.trim(),
        phone: phoneDraft.value.trim(),
        address: addressDraft.value.trim(),
        deliveryIntervalDays,
      },
    });
  } catch (enqueueError) {
    console.error(enqueueError);
    toast.show("Couldn't save the customer on this device. Try again.", "error");

    return;
  } finally {
    isEnqueuing.value = false;
  }

  toast.show("Customer added, pending owner approval");
  reset();
  open.value = false;
}

async function save(allowDuplicateName?: boolean) {
  hasAttempted.value = true;

  const customer = await run({
    firstName: firstNameDraft.value.trim(),
    lastName: lastNameDraft.value.trim(),
    phone: phoneDraft.value.trim(),
    address: addressDraft.value.trim(),
    riderId: riderDraft.value,
    deliveryIntervalDays: intervalDraft.value,
    allowDuplicateName,
  });

  if (error.value?.code === "customer.duplicate_name" && allowDuplicateName == null) {
    const name = fullName({ firstName: firstNameDraft.value.trim(), lastName: lastNameDraft.value.trim() });

    const isConfirmed = await confirmDialog.confirm({
      title: "Possible duplicate",
      message: [`A customer named ${name} already exists:`, ...duplicateNameLines(error.value.details), "Add anyway?"].join("\n"),
      confirmLabel: "Add anyway",
    });

    if (isConfirmed) {
      await save(true);
    }

    return;
  }

  if (error.value != null || customer == null) {
    return;
  }

  toast.show("Customer saved");
  emit("submit", customer);
  reset();
  open.value = false;
}

async function submit() {
  if (saveBlockReason.value != null) {
    return;
  }

  if (isRiderMode) {
    await enqueueCreate();

    return;
  }

  await save();
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add customer">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiField v-model="firstNameDraft" label="First name" autocomplete="off" />
        <UiField v-model="lastNameDraft" label="Last name" autocomplete="off" />
      </div>
      <UiField v-model="phoneDraft" label="Phone" type="tel" :error="phoneErrorMessage" />
      <UiField v-model="addressDraft" label="Address" hint="Free text, landmarks welcome" />
      <UiSelect v-if="!isRiderMode" v-model="riderDraft" label="Rider" :options="riderOptions" placeholder="No rider" />
      <UiNumberField
        v-model="intervalDraft"
        :label="intervalLabel"
        :required="isRiderMode"
        :min="DELIVERY_INTERVAL_DAYS.min"
        :max="DELIVERY_INTERVAL_DAYS.max"
        :hint="intervalHint"
      />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="formErrorMessage != null" role="alert" class="text-sm text-red-700">{{ formErrorMessage }}</p>
        <p v-if="duplicatePhoneCustomerId != null" class="text-sm text-red-700">
          <RouterLink :to="ROUTES.OWNER.CUSTOMERS.DETAIL(duplicatePhoneCustomerId)" class="font-medium text-red-800 underline">View customer</RouterLink>
        </p>
        <p v-if="saveBlockReason != null" :id="saveBlockReasonId" class="text-sm text-zinc-600">{{ saveBlockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton size="lg" :disabled="saveBlockReason != null" :aria-describedby="saveDescribedBy" :loading="isSaving" @click="submit">
            Save customer
          </UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
