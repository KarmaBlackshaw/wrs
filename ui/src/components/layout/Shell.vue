<script setup lang="ts">
import type { TTab } from "@/types";

const { items, home } = defineProps<{
  items: { label: string; to: string; icon: Component; activeIcon: Component; children?: TTab[] }[];
  home: string;
}>();

const route = useRoute();
const drawerOpen = ref(false);

const hasTabBar = computed(() => items.length <= 5);

watch(
  () => route.path,
  () => (drawerOpen.value = false)
);

function isActive(to: string) {
  return route.path === to || (to !== home && route.path.startsWith(`${to}/`));
}
</script>

<template>
  <div class="min-h-dvh bg-zinc-50 text-zinc-900" :class="hasTabBar ? '[--tabbar-h:calc(4rem+1px+env(safe-area-inset-bottom))] lg:[--tabbar-h:0px]' : ''">
    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 motion-reduce:transition-none lg:translate-x-0"
      :class="[drawerOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full', hasTabBar ? 'max-lg:hidden' : '']"
    >
      <RouterLink
        :to="home"
        class="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 px-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600"
      >
        <span class="grid size-9 place-items-center rounded-lg bg-brand-700 text-white">
          <IconDropFill class="size-5" />
        </span>
        <span class="flex flex-col leading-tight">
          <span class="text-base font-semibold tracking-tight">WRS</span>
          <span class="text-xs text-zinc-500">Water refilling station</span>
        </span>
      </RouterLink>

      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Main">
        <template v-for="item in items" :key="item.to">
          <RouterLink
            :to="item.to"
            :aria-current="isActive(item.to) && !item.children ? 'page' : undefined"
            class="flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-600 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800"
            :class="item.children && isActive(item.to) ? 'text-zinc-900' : 'text-zinc-600'"
          >
            <component :is="isActive(item.to) ? item.activeIcon : item.icon" class="size-5 shrink-0" />
            {{ item.label }}
          </RouterLink>
          <div v-if="item.children && isActive(item.to)" class="ml-5.5 flex flex-col gap-0.5 border-l border-zinc-200 pl-3">
            <RouterLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              :aria-current="route.path === child.to ? 'page' : undefined"
              class="flex h-8 items-center rounded-lg px-3 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-brand-600 aria-[current=page]:bg-brand-50 aria-[current=page]:font-medium aria-[current=page]:text-brand-800"
            >
              {{ child.label }}
            </RouterLink>
          </div>
        </template>
      </nav>
    </aside>

    <div v-if="drawerOpen" class="fixed inset-0 z-30 bg-zinc-950/40 lg:hidden" aria-hidden="true" @click="drawerOpen = false"></div>

    <div class="flex min-h-dvh min-w-0 flex-col lg:pl-64">
      <header class="sticky top-0 z-20 flex h-14 min-w-0 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:px-6">
        <button
          v-if="!hasTabBar"
          type="button"
          class="-ml-2 grid size-11 place-items-center rounded-lg text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-brand-600 lg:hidden"
          aria-label="Open navigation"
          :aria-expanded="drawerOpen"
          @click="drawerOpen = true"
        >
          <IconList class="size-6" />
        </button>
        <RouterLink :to="home" class="flex shrink-0 items-center gap-2 lg:hidden">
          <span class="grid size-8 place-items-center rounded-lg bg-brand-700 text-white">
            <IconDropFill class="size-4" />
          </span>
          <span class="text-base font-semibold tracking-tight">WRS</span>
        </RouterLink>
        <LayoutHeaderActions />
      </header>

      <main class="min-w-0 flex-1 px-4 pt-5 pb-[calc(var(--tabbar-h,0px)+1.5rem)] lg:px-6">
        <RouterView />
      </main>
    </div>

    <nav
      v-if="hasTabBar"
      class="fixed inset-x-0 bottom-0 z-30 grid auto-cols-fr grid-flow-col border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Main"
    >
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        class="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 aria-[current=page]:text-brand-700"
      >
        <component :is="isActive(item.to) ? item.activeIcon : item.icon" class="size-6" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
