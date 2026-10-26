const DEFAULT_RANGE_DAYS = 30;

export function useDateRangeQuery() {
  const from = useRouteQuery<string>("from", "", { mode: "push" });
  const to = useRouteQuery<string>("to", "", { mode: "push" });

  const range = computed(() => ({ from: from.value || undefined, to: to.value || undefined }));

  const label = computed(() => {
    if (from.value && to.value) {
      return formatPeriod(from.value, to.value);
    }

    if (from.value) {
      return `From ${formatDate(from.value)}`;
    }

    if (to.value) {
      return `Until ${formatDate(to.value)}`;
    }

    const today = toManila(Date.now());

    return formatPeriod(today.subtract(DEFAULT_RANGE_DAYS - 1, "day").format("YYYY-MM-DD"), today.format("YYYY-MM-DD"));
  });

  function clear() {
    from.value = "";
    to.value = "";
  }

  return { from, to, range, label, clear };
}
