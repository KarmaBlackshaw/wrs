import type { WatchSource } from "vue";

export function usePageQuery(key = "page") {
  const transform = { get: (value: string) => Math.max(1, Number.parseInt(value, 10) || 1), set: String };
  const page = useRouteQuery(key, "1", { transform, mode: "push" });
  const replacedPage = useRouteQuery(key, "1", { transform, mode: "replace" });

  function resetPageOn(sources: WatchSource | WatchSource[]) {
    watch(sources, () => {
      replacedPage.value = 1;
    });
  }

  function clampTo(lastPage: number) {
    replacedPage.value = lastPage;
  }

  return { page, resetPageOn, clampTo };
}
