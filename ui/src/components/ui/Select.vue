<script setup lang="ts" generic="T extends string">
import type { TOption } from "@/types";
const model = defineModel<T | null>();

const {
  options,
  error,
  placeholder = "Select an option",
} = defineProps<{
  label: string;
  options: TOption<T>[];
  error?: string;
  placeholder?: string;
}>();

defineOptions({ inheritAttrs: false });

const id = useId();
const labelId = `${id}-label`;
const listboxId = `${id}-listbox`;
const errorId = `${id}-error`;

const trigger = useTemplateRef("trigger");
const panel = useTemplateRef("panel");
const { open, floatingStyles } = useFloatingPanel(trigger, panel);

const activeIndex = ref(-1);

const selected = computed(() => options.find((option) => option.value === model.value) ?? null);

function optionId(index: number) {
  return `${id}-option-${index}`;
}

function show() {
  activeIndex.value = Math.max(
    0,
    options.findIndex((option) => option.value === model.value)
  );

  open.value = true;
}

function choose(index: number) {
  const option = options[index];

  if (option) {
    model.value = option.value;
  }

  open.value = false;
}

function move(delta: number) {
  if (!open.value) {
    show();

    return;
  }

  activeIndex.value = Math.min(options.length - 1, Math.max(0, activeIndex.value + delta));
}

function onEscape(event: KeyboardEvent) {
  if (!open.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  open.value = false;
}

function onEnter() {
  if (open.value) {
    choose(activeIndex.value);
  } else {
    show();
  }
}

watch(activeIndex, (index) => panel.value?.querySelector(`#${CSS.escape(optionId(index))}`)?.scrollIntoView({ block: "nearest" }));
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span :id="labelId" class="text-sm font-medium text-zinc-700">{{ label }}</span>
    <button
      ref="trigger"
      type="button"
      role="combobox"
      :aria-labelledby="labelId"
      :aria-controls="listboxId"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="!!error"
      class="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-left text-sm text-zinc-900 shadow-xs focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 focus-visible:outline-none"
      :class="[
        error ? 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/15' : '',
        open ? 'border-brand-600 ring-4 ring-brand-600/15' : '',
      ]"
      v-bind="$attrs"
      @click="open ? (open = false) : show()"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.home.prevent="open && (activeIndex = 0)"
      @keydown.end.prevent="open && (activeIndex = options.length - 1)"
      @keydown.enter.prevent="onEnter"
      @keydown.space.prevent="onEnter"
      @keydown.esc="onEscape"
      @keydown.tab="open = false"
    >
      <span class="truncate" :class="selected ? '' : 'text-zinc-500'">{{ selected?.label ?? placeholder }}</span>
      <IconCaretUpDown class="size-4 shrink-0 text-zinc-500" />
    </button>
    <ul
      popover="manual"
      :id="listboxId"
      ref="panel"
      role="listbox"
      :aria-labelledby="labelId"
      class="inset-auto m-0 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
      :style="floatingStyles"
    >
      <li
        v-for="(option, index) in options"
        :id="optionId(index)"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
        class="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm text-zinc-800"
        :class="index === activeIndex ? 'bg-zinc-100' : ''"
        @mouseenter="activeIndex = index"
        @mousedown.prevent
        @click="choose(index)"
      >
        <span class="truncate" :class="option.value === model ? 'font-medium text-zinc-900' : ''">{{ option.label }}</span>
        <IconCheck v-if="option.value === model" class="size-4 shrink-0 text-brand-700" />
      </li>
    </ul>
    <p v-if="error" :id="errorId" class="text-sm text-red-700">{{ error }}</p>
  </div>
</template>
