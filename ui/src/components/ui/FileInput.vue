<script setup lang="ts">
const model = defineModel<File>();

defineProps<{
  label: string;
  accept?: string;
  capture?: "user" | "environment";
}>();

const id = useId();
const input = useTemplateRef("input");

watch(model, (file) => {
  if (!file && input.value) {
    input.value.value = "";
  }
});

function onChange(event: Event) {
  const target = event.target;

  model.value = target instanceof HTMLInputElement ? target.files?.[0] : undefined;
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-medium text-zinc-700">{{ label }}</label>
    <input
      :id="id"
      ref="input"
      type="file"
      :accept="accept"
      :capture="capture"
      class="text-sm text-zinc-600 file:mr-3 file:h-10 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-4 file:font-semibold file:text-zinc-800 file:shadow-xs hover:file:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      @change="onChange"
    />
    <p v-if="model" class="text-sm text-emerald-700">Attached: {{ model.name }}</p>
  </div>
</template>
