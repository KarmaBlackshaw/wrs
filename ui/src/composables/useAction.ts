import type { TErrorCode } from "@wrs/contract/common";

import { ApiError } from "@/lib/http";

export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, options: { inline?: TErrorCode[] } = {}) {
  const toast = useToast();
  const isRunning = ref(false);
  const error = shallowRef<ApiError>();

  async function run(...args: A) {
    if (isRunning.value) {
      return undefined;
    }

    isRunning.value = true;
    error.value = undefined;

    try {
      return await fn(...args);
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught;
      }

      error.value = caught;

      const isInline = options.inline?.some((code) => code === caught.code) ?? false;

      if (!isInline) {
        toast.show(caught.message, "error");
      }

      return undefined;
    } finally {
      isRunning.value = false;
    }
  }

  return { run, isRunning: readonly(isRunning), error: shallowReadonly(error) };
}
