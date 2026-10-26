<script setup lang="ts">
import { openDrawer } from "@/services/drawer";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{ submit: [] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(openDrawer, { inline: ["drawer.open_exists"] });

const openingCash = ref(0);

watch(open, (isOpen) => {
  if (isOpen) {
    openingCash.value = 0;
  }
});

async function submit() {
  await run({ openingCash: openingCash.value });

  if (error.value != null) {
    return;
  }

  emit("submit");
  open.value = false;
  toast.show("Saved");
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Open drawer">
    <div class="flex flex-col gap-4">
      <UiMoneyPad v-model="openingCash" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :loading="isRunning" @click="submit">Confirm opening cash</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
