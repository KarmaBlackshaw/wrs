<script setup lang="ts">
import type { TCustomer } from "@wrs/contract/customer";

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
        <span class="text-base font-medium text-zinc-900">{{ fullName(customer) }}</span>
        <span class="text-sm text-zinc-500">{{ customer.address }}</span>
      </div>
      <UiButton variant="ghost" @click="emit('change')">Change</UiButton>
    </div>
    <dl class="mt-3 grid grid-cols-3 gap-2 text-sm">
      <div class="flex flex-col">
        <dt class="text-zinc-500">Containers held</dt>
        <dd class="font-medium text-zinc-900">{{ customer.containersHeld }}</dd>
      </div>
      <div class="flex flex-col">
        <dt class="text-zinc-500">Deposit on file</dt>
        <dd><UiMoneyText :centavos="customer.depositOnFile" /></dd>
      </div>
      <div class="flex flex-col">
        <dt class="text-zinc-500">Credit balance</dt>
        <dd><UiMoneyText :centavos="customer.creditBalance" /></dd>
      </div>
    </dl>
    <slot></slot>
  </UiCard>
</template>
