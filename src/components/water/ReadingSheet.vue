<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

const toast = useToast();

const tdsInput = ref("");
const phInput = ref("");
const meterInput = ref("");

const canSubmit = computed(() => tdsInput.value.trim() !== "" || meterInput.value.trim() !== "");

watch(open, (isOpen) => {
  if (isOpen) {
    tdsInput.value = "";
    phInput.value = "";
    meterInput.value = "";
  }
});

function submitReading() {
  if (!canSubmit.value) {
    return;
  }

  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Log reading">
    <div class="flex flex-col gap-4">
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">TDS (ppm)</p>
        <UiNumberPad v-model="tdsInput" />
      </div>
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">pH (optional)</p>
        <UiNumberPad v-model="phInput" />
      </div>
      <div>
        <p class="mb-1.5 text-sm font-medium text-zinc-700">Meter liters (optional)</p>
        <UiNumberPad v-model="meterInput" />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmit" @click="submitReading">Save reading</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
