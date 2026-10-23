<script setup lang="ts">
const { tone = "default" } = defineProps<{
  label: string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "danger";
}>();

const toneClasses = {
  default: "text-zinc-900",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-red-700",
} as const;
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
    <span class="text-sm font-medium text-zinc-500">{{ label }}</span>
    <span class="text-2xl font-semibold tracking-tight tabular-nums" :class="toneClasses[tone]">
      <slot></slot>
    </span>
    <span v-if="hint" class="text-xs text-zinc-500">{{ hint }}</span>
  </div>
</template>
