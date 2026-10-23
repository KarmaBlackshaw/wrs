<script setup lang="ts">
const open = defineModel<boolean>("open", { default: false });

defineProps<{
  title?: string;
}>();

const dialogRef = useTemplateRef<HTMLDialogElement>("dialog");

watch(open, (value) => {
  const dialog = dialogRef.value;

  if (!dialog) {
    return;
  }

  if (value && !dialog.open) {
    dialog.showModal();
  } else if (!value && dialog.open) {
    dialog.close();
  }
});

function onClose() {
  open.value = false;
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialogRef.value) {
    open.value = false;
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    class="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85vh] w-full max-w-full rounded-t-xl bg-white p-0 shadow-xl backdrop:bg-zinc-950/40 lg:inset-0 lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-w-lg lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl"
    @close="onClose"
    @click="onBackdropClick"
  >
    <div class="flex max-h-[85vh] flex-col">
      <header v-if="title" class="flex items-center justify-between border-b border-zinc-200 py-3 pr-2 pl-5">
        <h2 class="text-base font-semibold text-zinc-900">{{ title }}</h2>
        <button
          type="button"
          aria-label="Close"
          class="flex size-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-600"
          @click="open = false"
        >
          <IconX class="size-5" />
        </button>
      </header>
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <slot></slot>
      </div>
      <footer v-if="$slots.footer" class="border-t border-zinc-200 bg-zinc-50 px-5 py-3">
        <slot name="footer"></slot>
      </footer>
    </div>
  </dialog>
</template>
