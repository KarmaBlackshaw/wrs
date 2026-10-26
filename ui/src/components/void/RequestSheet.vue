<script setup lang="ts">
import type { TVoid, TVoidRefType } from "@wrs/contract/void";

import { createVoid } from "@/services/void";

const target = defineModel<{ refType: Exclude<TVoidRefType, "payment">; refId: string; summary: string }>("target");

const emit = defineEmits<{ submit: [void: TVoid] }>();

const toast = useToast();
const { run, isRunning, error } = useAction(createVoid, { inline: ["void.already_voided"] });

const draft = ref("");
const hasSubmitted = ref(false);
const reason = computed(() => draft.value.trim());

const isOpen = computed({
  get: () => target.value != null,
  set: (value) => {
    if (!value) {
      target.value = undefined;
    }
  },
});

watch(target, (value) => {
  if (value != null) {
    draft.value = "";
    hasSubmitted.value = false;
  }
});

async function submit() {
  const current = target.value;

  if (current == null || !reason.value) {
    return;
  }

  const { refType, refId } = current;
  hasSubmitted.value = true;
  const result = await run({ refType, refId, reason: reason.value });

  if (error.value != null || result == null) {
    return;
  }

  emit("submit", result);
  target.value = undefined;
  toast.show(result.status === "approved" ? "Voided" : "Sent for approval");
}
</script>

<template>
  <UiBottomSheet v-model:open="isOpen" title="Request void">
    <div class="flex flex-col gap-4">
      <p class="text-base whitespace-pre-line text-zinc-700">{{ target?.summary }}</p>
      <UiTextarea v-model="draft" label="Reason" :hint="reason ? undefined : 'A reason is required'" />
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <p v-if="hasSubmitted && error != null" role="alert" class="text-sm text-red-700">{{ error.message }}</p>
        <div class="flex justify-end gap-2">
          <UiButton :disabled="!reason" :loading="isRunning" @click="submit">Submit void request</UiButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>
