import type { TToast, TToastTone } from "@/types";

const toasts = ref<TToast[]>([]);
let nextId = 1;

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

function show(message: string, tone: TToastTone = "success") {
  const id = nextId++;

  toasts.value.push({ id, message, tone });

  setTimeout(() => dismiss(id), 3000);
}

export function useToast() {
  return { toasts: readonly(toasts), show, dismiss };
}
