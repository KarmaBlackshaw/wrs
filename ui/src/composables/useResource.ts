import type { WatchSource } from "vue";

import { ApiError } from "@/lib/http";

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, options: { watch?: WatchSource | WatchSource[]; debounce?: number } = {}) {
  const data = shallowRef<T>();
  const isLoading = ref(false);
  const error = shallowRef<ApiError>();
  let controller: AbortController | undefined;

  async function reload() {
    controller?.abort();

    const current = new AbortController();

    controller = current;
    isLoading.value = true;
    error.value = undefined;

    try {
      const result = await load(current.signal);

      if (!current.signal.aborted) {
        data.value = result;
      }
    } catch (caught) {
      if (current.signal.aborted) {
        return;
      }

      if (!(caught instanceof ApiError)) {
        throw caught;
      }

      error.value = caught;
    } finally {
      if (controller === current) {
        isLoading.value = false;
      }
    }
  }

  const { watch: source, debounce } = options;

  if (source != null) {
    if (debounce != null) {
      watchDebounced(source, reload, { debounce });
    } else {
      watch(source, reload);
    }
  }

  onScopeDispose(() => controller?.abort());

  reload();

  return { data: shallowReadonly(data), isLoading: readonly(isLoading), error: shallowReadonly(error), reload };
}
