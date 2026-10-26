<script setup lang="ts">
import { ROLE_HOME, ROUTES } from "@/types";

definePage({ meta: { title: "Not found" } });

const authStore = useAuthStore();

const homeRoute = computed(() => (authStore.activeRole ? ROLE_HOME[authStore.activeRole] : ROUTES.LOGIN));
</script>

<template>
  <div class="flex flex-col items-start gap-2 p-6">
    <h1 class="text-2xl font-semibold">Page not found</h1>
    <RouterLink :to="homeRoute" class="text-sm underline">Back home</RouterLink>
  </div>
</template>
