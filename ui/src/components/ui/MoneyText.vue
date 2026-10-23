<script setup lang="ts">
const {
  centavos,
  size = "md",
  tone = "default",
} = defineProps<{
  centavos: number;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "muted" | "ok" | "warn" | "danger";
}>();

const formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

const formatted = computed(() => formatter.format(centavos / 100));

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl tracking-tight",
  xl: "text-4xl tracking-tight",
} as const;

const toneClasses = {
  default: "text-zinc-900",
  muted: "text-zinc-500",
  ok: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-red-700",
} as const;
</script>

<template>
  <span class="font-semibold tabular-nums" :class="[sizeClasses[size], toneClasses[tone]]">{{ formatted }}</span>
</template>
