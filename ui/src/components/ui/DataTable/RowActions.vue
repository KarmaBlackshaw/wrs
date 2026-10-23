<script setup lang="ts">
import type { TRowAction } from "@/types";

const {
  actions,
  collapsed,
  label = "Actions",
} = defineProps<{
  actions: TRowAction[];
  collapsed?: boolean;
  label?: string;
}>();

const router = useRouter();

const id = useId();
const trigger = useTemplateRef("trigger");
const panel = useTemplateRef("panel");
const { open, floatingStyles } = useFloatingPanel(trigger, panel, { placement: "bottom-end", matchWidth: false });

function items() {
  return [...(panel.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
}

async function show(index = 0) {
  open.value = true;
  await nextTick();
  items().at(index)?.focus();
}

function close() {
  open.value = false;
  trigger.value?.focus();
}

function move(delta: number) {
  const list = items();
  const current = list.findIndex((item) => item === document.activeElement);

  list[(current + delta + list.length) % list.length]?.focus();
}

function select(action: TRowAction) {
  close();

  if (action.to) {
    router.push(action.to);
  } else {
    action.onSelect?.();
  }
}
</script>

<template>
  <div class="flex justify-end gap-2">
    <template v-if="!collapsed">
      <UiButton v-for="action in actions" :key="action.label" size="sm" :variant="action.variant ?? 'secondary'" :to="action.to" @click="action.onSelect?.()">
        {{ action.label }}
      </UiButton>
    </template>
    <template v-else-if="actions.length">
      <button
        ref="trigger"
        type="button"
        :aria-label="label"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-controls="id"
        class="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-600"
        :class="open ? 'bg-zinc-100 text-zinc-900' : ''"
        @click="open ? (open = false) : show()"
        @keydown.down.prevent="show()"
        @keydown.up.prevent="show(-1)"
      >
        <IconDotsThree class="size-5" />
      </button>
      <div
        popover="manual"
        :id="id"
        ref="panel"
        role="menu"
        :aria-label="label"
        class="inset-auto m-0 min-w-44 flex-col overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg open:flex"
        :style="floatingStyles"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.home.prevent="items().at(0)?.focus()"
        @keydown.end.prevent="items().at(-1)?.focus()"
        @keydown.esc.stop.prevent="close"
        @keydown.tab="open = false"
      >
        <button
          v-for="action in actions"
          :key="action.label"
          type="button"
          role="menuitem"
          tabindex="-1"
          class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm focus-visible:outline-none"
          :class="
            action.variant === 'danger' ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50' : 'text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100'
          "
          @click="select(action)"
        >
          <component :is="action.icon" v-if="action.icon" class="size-4" />
          {{ action.label }}
        </button>
      </div>
    </template>
  </div>
</template>
