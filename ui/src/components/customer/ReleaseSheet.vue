<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

import { releaseCustomer, updateCustomer } from "@/services/customer";

const customer = defineModel<TCustomer>("customer");

const emit = defineEmits<{
  submit: [customer: TCustomer];
}>();

const employeeStore = useEmployeeStore();
const { riderOptions } = storeToRefs(employeeStore);
const toast = useToast();
const release = useAction(releaseCustomer);
const reassign = useAction(updateCustomer);
const reasonId = useId();

const isOpen = computed({
  get: () => customer.value != null,
  set: (value) => {
    if (!value) {
      customer.value = undefined;
    }
  },
});

const riderDraft = ref("");

const riderDraftOptions = computed(() => [{ value: "", label: "Open (release)" }, ...riderOptions.value]);
const isRunning = computed(() => release.isRunning.value || reassign.isRunning.value);
const actionError = computed(() => release.error.value ?? reassign.error.value);

const blockReason = computed(() => {
  if (customer.value == null || riderDraft.value !== (customer.value.riderId ?? "")) {
    return undefined;
  }

  return customer.value.riderName != null ? `Already assigned to ${customer.value.riderName}` : "Already open";
});

watch(isOpen, async (value) => {
  if (!value || customer.value == null) {
    return;
  }

  riderDraft.value = customer.value.riderId ?? "";

  await employeeStore.load();
});

async function submit() {
  if (customer.value == null) {
    return;
  }

  const { id } = customer.value;
  const isRelease = riderDraft.value === "";
  const action = isRelease ? release : reassign;
  const updated = isRelease ? await release.run({ id, body: {} }) : await reassign.run({ id, body: { riderId: riderDraft.value } });

  if (action.error.value != null || updated == null) {
    return;
  }

  toast.show(isRelease ? "Customer released" : "Customer reassigned");
  emit("submit", updated);
  customer.value = undefined;
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Release or reassign">
    <div class="flex flex-col gap-4">
      <UiSelect v-model="riderDraft" label="Assign to" :options="riderDraftOptions" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="actionError != null" role="alert" class="text-sm text-red-700">{{ actionError.message }}</p>
        <p v-if="blockReason != null" :id="reasonId" class="text-sm text-zinc-600">{{ blockReason }}</p>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" size="lg" @click="isOpen = false">Cancel</UiButton>
          <UiButton
            size="lg"
            :disabled="blockReason != null"
            :aria-describedby="blockReason != null ? reasonId : undefined"
            :loading="isRunning"
            @click="submit"
          >
            {{ riderDraft === "" ? "Release" : "Reassign" }}
          </UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
