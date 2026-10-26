<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const toast = useToast();
const movementAction = ref("damaged");
const movementType = ref("round");
const movementQty = ref(1);
const movementReason = ref("");

const movementActionOptions = [
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "purchased", label: "Purchased" },
];

const containerTypeOptions = [
  { value: "round", label: "Round" },
  { value: "slim", label: "Slim" },
];

function submit() {
  toast.show("Container movement saved");
  open.value = false;
  movementQty.value = 1;
  movementReason.value = "";
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Record container movement">
    <div class="flex flex-col gap-4">
      <UiSegmentedControl v-model="movementAction" :options="movementActionOptions" />
      <UiSelect v-model="movementType" label="Container type" :options="containerTypeOptions" />
      <UiStepper v-model="movementQty" label="Quantity" :min="1" />
      <UiField v-model="movementReason" label="Reason" :hint="movementAction === 'purchased' ? 'Optional' : 'Required'" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="movementAction !== 'purchased' && !movementReason.trim()" @click="submit">Save movement</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
