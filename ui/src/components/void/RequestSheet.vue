<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

defineProps<{
  summary: string;
}>();

const toast = useToast();
const reason = ref("");

const canSubmit = computed(() => reason.value.trim().length > 0);

function submit() {
  if (!canSubmit.value) {
    return;
  }

  toast.show("Void requested");
  reason.value = "";
  open.value = false;
}
</script>

<template>
  <UiBottomSheet v-model:open="open" title="Request void">
    <div class="flex flex-col gap-4">
      <p class="text-base whitespace-pre-line text-zinc-700">{{ summary }}</p>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-zinc-700">Reason</span>
        <textarea
          v-model="reason"
          required
          rows="3"
          class="w-full rounded-lg border border-zinc-300 bg-white p-3 text-base text-zinc-900 shadow-xs placeholder:text-zinc-500 focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
        ></textarea>
      </label>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton :disabled="!canSubmit" @click="submit">Submit void request</UiButton>
      </div>
    </template>
  </UiBottomSheet>
</template>
