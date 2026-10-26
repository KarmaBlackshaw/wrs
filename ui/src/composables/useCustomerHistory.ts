import type { TPage } from "@wrs/contract/common";

type TFetchOptions = { customerId: string; page: number; signal: AbortSignal };

export function useCustomerHistory<T>(
  fetchPage: (options: TFetchOptions) => Promise<TPage<T>>,
  { customerId, pageKey }: { customerId: () => string; pageKey: string }
) {
  const { page, resetPageOn, clampTo } = usePageQuery(pageKey);

  resetPageOn(customerId);

  const { data, isLoading, error, reload } = useResource((signal) => fetchPage({ customerId: customerId(), page: page.value, signal }), {
    watch: [page, customerId],
  });

  const rows = computed(() => data.value?.items ?? []);

  return { page, clampTo, data, rows, isLoading, error, reload };
}
