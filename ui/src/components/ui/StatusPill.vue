<script setup lang="ts">
import type { TTone } from "@/types";

const { tone = "neutral" } = defineProps<{
  tone?: TTone;
}>();

const toneClasses: Record<TTone, string> = {
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/25",
  danger: "bg-red-50 text-red-800 ring-red-600/20",
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
  info: "bg-brand-50 text-brand-800 ring-brand-600/20",
};
</script>

<template>
  <span
    class="inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset"
    :class="toneClasses[tone]"
  >
    <slot></slot>
  </span>
</template>
