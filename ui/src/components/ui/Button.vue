<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { TButtonVariant } from "@/types";

const {
  variant = "primary",
  size = "md",
  block = false,
  to,
  loading = false,
  disabled = false,
  type = "button",
} = defineProps<{
  variant?: TButtonVariant;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  to?: RouteLocationRaw;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}>();

const isDisabled = computed(() => disabled || loading);

const variantClasses = {
  primary: "bg-brand-700 text-white shadow-xs hover:bg-brand-800",
  secondary: "border border-zinc-300 bg-white text-zinc-800 shadow-xs hover:bg-zinc-50",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "bg-red-600 text-white shadow-xs hover:bg-red-700",
} as const;

const sizeClasses = {
  sm: "h-8 gap-1.5 px-2.5 text-sm",
  md: "h-10 gap-2 px-3.5 text-sm",
  lg: "h-11 gap-2 px-4 text-base",
} as const;

const baseClasses =
  "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

function onLinkClick(event: MouseEvent) {
  if (!isDisabled.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    :aria-disabled="isDisabled"
    :tabindex="isDisabled ? -1 : undefined"
    :class="[baseClasses, variantClasses[variant], sizeClasses[size], block ? 'w-full' : '', isDisabled ? 'pointer-events-none opacity-50' : '']"
    @click="onLinkClick"
  >
    <IconCircleNotch v-if="loading" class="size-4 animate-spin" />
    <slot></slot>
  </RouterLink>
  <button
    v-else
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading"
    class="disabled:pointer-events-none disabled:opacity-50"
    :class="[baseClasses, variantClasses[variant], sizeClasses[size], block ? 'w-full' : '']"
  >
    <IconCircleNotch v-if="loading" class="size-4 animate-spin" />
    <slot></slot>
  </button>
</template>
