<script setup lang="ts">
import type { TCustomer } from "@/types";

defineProps<{
  customer: TCustomer;
  title?: string;
}>();

const emit = defineEmits<{ change: [] }>();
</script>

<template>
  <UiCard :title>
    <div class="flex items-center justify-between gap-2">
      <div class="flex flex-col">
        <span class="text-base font-medium text-zinc-900">{{ customer.name }}</span>
        <span class="text-sm text-zinc-500">{{ customer.address }}</span>
      </div>
      <UiButton variant="ghost" @click="emit('change')">Change</UiButton>
    </div>
    <slot></slot>
  </UiCard>
</template>
