<script setup lang="ts">
const { layout } = useLayout();
</script>

<template>
  <component :is="layout" />
  <UiToast />
</template>
