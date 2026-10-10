<script setup lang="ts">
import type { TCustomer } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { customer } = defineProps<{
  customer: TCustomer;
}>();

const { riderOptions } = useEmployeeLookup();
const toast = useToast();

const nameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const riderDraft = ref("");
const riderDraftOptions = [{ value: "", label: "Open" }, ...riderOptions];
const canSaveCustomer = computed(() => nameDraft.value.trim().length > 0 && phoneDraft.value.trim().length > 0);

watch(open, (isOpen) => {
  if (isOpen) {
    nameDraft.value = customer.name;
    phoneDraft.value = customer.phone;
    addressDraft.value = customer.address;
    riderDraft.value = customer.riderId ?? "";
  }
});

function submit() {
  toast.show("Customer saved");
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Edit customer">
    <div class="flex flex-col gap-4">
      <UiField v-model="nameDraft" label="Name" />
      <UiField v-model="phoneDraft" label="Phone" type="tel" />
      <UiField v-model="addressDraft" label="Address" />
      <UiSelect v-model="riderDraft" label="Rider" :options="riderDraftOptions" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSaveCustomer" @click="submit">Save</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
