<script setup lang="ts">
const isOnline = useOnline();
</script>

<template>
  <div v-if="!isOnline" role="status" class="bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 lg:px-6 lg:pl-64">
    You're offline. Changes can't be saved until you reconnect.
  </div>
</template>
