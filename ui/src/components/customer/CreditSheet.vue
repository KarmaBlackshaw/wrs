<script setup lang="ts">
import type { TCustomer } from "@/types";

const open = defineModel<boolean>("open", { default: false });

const { customer } = defineProps<{
  customer: TCustomer;
}>();

const toast = useToast();
const creditEnabledDraft = ref("enabled");
const limitDraft = ref(0);

const creditOptions = [
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
];

watch(open, (isOpen) => {
  if (isOpen) {
    creditEnabledDraft.value = customer.creditEnabled ? "enabled" : "disabled";
    limitDraft.value = (customer.creditLimit ?? 0) / 100;
  }
});

function submit() {
  toast.show("Credit settings saved");
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Credit settings">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="creditEnabledDraft" :options="creditOptions" />
      <UiStepper v-if="creditEnabledDraft === 'enabled'" v-model="limitDraft" label="Credit limit (pesos)" :min="0" :step="500" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton @click="submit">Save</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
