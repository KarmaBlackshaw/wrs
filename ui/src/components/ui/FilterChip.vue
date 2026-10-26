<script setup lang="ts">
const { label, value } = defineProps<{
  label: string;
  value?: string;
}>();

const emit = defineEmits<{ clear: [] }>();

const id = useId();
const titleId = `${id}-title`;

const trigger = useTemplateRef("trigger");
const panel = useTemplateRef("panel");
const { open, floatingStyles } = useFloatingPanel(trigger, panel, { matchWidth: false });

function close() {
  open.value = false;
  trigger.value?.querySelector("button")?.focus();
}
</script>

<template>
  <div
    ref="trigger"
    class="inline-flex h-7 items-center rounded-full text-xs font-medium"
    :class="value ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-600/20 ring-inset' : 'border border-dashed border-zinc-300 text-zinc-600 hover:bg-zinc-50'"
  >
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="id"
      class="flex h-full items-center gap-1 rounded-full px-2.5 focus-visible:outline-2 focus-visible:outline-brand-600"
      @click="open = !open"
    >
      <IconPlus v-if="!value" class="size-3" />
      {{ label }}
      <template v-if="value">
        <span class="text-brand-600/40" aria-hidden="true">|</span>
        <span class="font-semibold">{{ value }}</span>
      </template>
    </button>
    <button
      v-if="value"
      type="button"
      :aria-label="`Clear ${label} filter`"
      class="-ml-1 flex size-6 items-center justify-center rounded-full hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-brand-600"
      @click="emit('clear')"
    >
      <IconX class="size-3" />
    </button>
  </div>
  <div
    popover="manual"
    :id="id"
    ref="panel"
    role="dialog"
    :aria-labelledby="titleId"
    class="inset-auto m-0 w-72 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg open:flex"
    :style="floatingStyles"
    @keydown.esc.stop="close"
  >
    <p :id="titleId" class="text-sm font-semibold text-zinc-900">Filter by {{ label }}</p>
    <slot :close="close"></slot>
  </div>
</template>
