<script setup lang="ts"></script>

<template>
  <div class="grid min-h-dvh bg-white text-zinc-900 lg:grid-cols-2">
    <aside class="hidden flex-col justify-between bg-brand-800 p-12 text-white lg:flex">
      <div class="flex items-center gap-3">
        <span class="grid size-10 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20 ring-inset">
          <IconDropFill class="size-6" />
        </span>
        <span class="text-lg font-semibold tracking-tight">WRS</span>
      </div>
      <div class="flex max-w-md flex-col gap-4">
        <h2 class="text-4xl leading-tight font-semibold tracking-tight">Run the station from one place.</h2>
        <p class="text-base text-brand-100">Deliveries, walk-in sales, containers and cash, even without signal.</p>
      </div>
    </aside>
    <main class="flex items-center justify-center px-4 py-10 sm:px-8">
      <RouterView />
    </main>
  </div>
</template>
