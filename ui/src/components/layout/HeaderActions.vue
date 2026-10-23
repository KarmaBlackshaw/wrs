<script setup lang="ts">
import { ROLE_LABEL } from "@/types";

const authStore = useAuthStore();
const route = useRoute();

const id = useId();
const trigger = useTemplateRef("trigger");
const panel = useTemplateRef("panel");
const { open, floatingStyles } = useFloatingPanel(trigger, panel, { placement: "bottom-end", matchWidth: false, maxHeight: 480 });

function close() {
  open.value = false;
  trigger.value?.focus();
}

watch(
  () => route.fullPath,
  () => (open.value = false)
);
</script>

<template>
  <div class="ml-auto flex min-w-0 items-center gap-3">
    <template v-if="authStore.user">
      <button
        ref="trigger"
        type="button"
        class="flex min-w-0 items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        :class="open ? 'bg-zinc-100' : ''"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="id"
        @click="open = !open"
      >
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">{{
          initials(authStore.user.name)
        }}</span>
        <span class="hidden min-w-0 flex-col text-left leading-tight sm:flex">
          <span class="truncate text-sm font-medium text-zinc-900">{{ authStore.user.name }}</span>
          <span v-if="authStore.activeRole" class="text-xs text-zinc-500">{{ ROLE_LABEL[authStore.activeRole] }}</span>
        </span>
        <IconCaretDown class="size-4 shrink-0 text-zinc-500" />
        <span class="sr-only">Account menu</span>
      </button>
      <div
        popover="manual"
        :id="id"
        ref="panel"
        role="dialog"
        aria-label="Account"
        class="inset-auto m-0 w-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 shadow-lg"
        :style="floatingStyles"
        @keydown.esc.prevent="close"
      >
        <LayoutAccountControls />
      </div>
    </template>
  </div>
</template>
