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
  <dialog ref="dialog" class="m-auto w-full max-w-sm rounded-xl bg-white p-0 shadow-xl backdrop:bg-zinc-950/40" @close="onClose" @click="onBackdropClick">
    <div class="flex flex-col gap-3 p-6">
      <h2 v-if="title" class="text-lg font-semibold tracking-tight text-zinc-900">{{ title }}</h2>
      <div class="text-base text-zinc-600">
        <slot></slot>
      </div>
      <footer v-if="$slots.footer" class="mt-2 flex justify-end gap-2">
        <slot name="footer"></slot>
      </footer>
    </div>
  </dialog>
</template>
