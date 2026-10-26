import type { TTripStatus } from "@wrs/contract/trip";

import { listTrips } from "@/services/trip";

const PAGE_SIZE = 20;

export function useTripList() {
  const employeeStore = useEmployeeStore();
  const { riderOptions } = storeToRefs(employeeStore);

  employeeStore.load();

  const status = useRouteQuery<"all" | TTripStatus>("status", "all", { mode: "push" });
  const riderId = useRouteQuery("riderId", "all", { mode: "push" });
  const from = useRouteQuery("from", "", { mode: "push" });
  const to = useRouteQuery("to", "", { mode: "push" });
  const { page, resetPageOn, clampTo } = usePageQuery();

  resetPageOn([status, riderId, from, to]);

  const { data, isLoading, error, reload } = useResource(
    (signal) =>
      listTrips(
        {
          status: status.value === "all" ? undefined : status.value,
          riderId: riderId.value === "all" ? undefined : riderId.value,
          from: from.value || undefined,
          to: to.value || undefined,
          page: page.value,
          pageSize: PAGE_SIZE,
        },
        signal
      ),
    { watch: [status, riderId, from, to, page] }
  );

  const riderFilterOptions = computed(() => [{ value: "all", label: "All riders" }, ...riderOptions.value]);

  return { status, riderId, from, to, page, clampTo, data, isLoading, error, reload, riderFilterOptions, pageSize: PAGE_SIZE };
}
