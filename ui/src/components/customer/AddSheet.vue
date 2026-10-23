<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const nameDraft = ref("");
const phoneDraft = ref("");
const addressDraft = ref("");
const canSaveCustomer = computed(() => nameDraft.value.trim().length > 0 && phoneDraft.value.trim().length > 0);

function submit() {
  if (!canSaveCustomer.value) {
    return;
  }

  toast.show("Customer saved");
  nameDraft.value = "";
  phoneDraft.value = "";
  addressDraft.value = "";
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Add customer">
    <div class="flex flex-col gap-4">
      <UiField v-model="nameDraft" label="Name" />
      <UiField v-model="phoneDraft" label="Phone" type="tel" />
      <UiField v-model="addressDraft" label="Address" hint="Free text, landmarks welcome" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSaveCustomer" @click="submit">Save customer</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
