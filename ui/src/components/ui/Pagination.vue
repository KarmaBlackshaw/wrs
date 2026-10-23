<script setup lang="ts">
const {
  total,
  pageSize,
  label = "Pagination",
} = defineProps<{
  total: number;
  pageSize: number;
  label?: string;
}>();

const emit = defineEmits<{
  clamp: [lastPage: number];
}>();

const page = defineModel<number>("page", { required: true });

const prevButton = useTemplateRef("prevButton");
const nextButton = useTemplateRef("nextButton");

const lastPage = computed(() => Math.ceil(total / pageSize));
const rangeStart = computed(() => (page.value - 1) * pageSize + 1);
const rangeEnd = computed(() => Math.min(page.value * pageSize, total));

const pages = computed(() => {
  const last = lastPage.value;
  const wanted = new Set([1, last, page.value - 1, page.value, page.value + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b);

  return numbers.flatMap((n, index) => {
    const previous = numbers[index - 1];

    return previous != null && n - previous > 1 ? ["…", n] : [n];
  });
});

watch(
  [() => total, page],
  () => {
    if (lastPage.value > 0 && page.value > lastPage.value) {
      emit("clamp", lastPage.value);
    }
  },
  { immediate: true }
);

const itemBase = "grid size-11 place-items-center rounded-lg border text-sm focus-visible:outline-2 focus-visible:outline-brand-600";
const idleClasses = "border-zinc-300 bg-white text-zinc-700 shadow-xs hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white";
const currentClasses = "border-brand-600 bg-brand-50 font-semibold text-brand-700";

async function step(delta: number) {
  page.value += delta;
  await nextTick();

  if (prevButton.value?.disabled) {
    nextButton.value?.focus();
  } else if (nextButton.value?.disabled) {
    prevButton.value?.focus();
  }
}
</script>

<template>
  <nav v-if="total > pageSize" :aria-label="label" class="flex flex-wrap items-center justify-between gap-2">
    <p aria-live="polite" class="text-sm text-zinc-500 tabular-nums">{{ rangeStart }}–{{ rangeEnd }} of {{ total }}</p>
    <div class="flex flex-wrap items-center gap-2">
      <button ref="prevButton" type="button" aria-label="Previous page" :class="[itemBase, idleClasses]" :disabled="page <= 1" @click="step(-1)">
        <IconCaretLeft class="size-4" />
      </button>
      <span class="text-sm text-zinc-700 tabular-nums sm:hidden">Page {{ page }} of {{ lastPage }}</span>
      <template v-for="(item, index) in pages" :key="`${item}-${index}`">
        <span v-if="item === '…'" class="hidden px-1 text-zinc-500 sm:block">…</span>
        <button
          v-else
          type="button"
          :aria-label="`Page ${item}`"
          :aria-current="item === page ? 'page' : undefined"
          :class="[itemBase, 'hidden sm:grid', item === page ? currentClasses : idleClasses]"
          @click="page = Number(item)"
        >
          {{ item }}
        </button>
      </template>
      <button ref="nextButton" type="button" aria-label="Next page" :class="[itemBase, idleClasses]" :disabled="page >= lastPage" @click="step(1)">
        <IconCaretRight class="size-4" />
      </button>
    </div>
  </nav>
</template>
