import type { TApprovalCategory, TApprovalStatus } from "@wrs/contract/approval";

import { listApprovals } from "@/services/approval";

export function useApprovalList<C extends TApprovalCategory>(category: C, status: () => TApprovalStatus) {
  const { page, clampTo } = usePageQuery(`${category}Page`);

  const { data, isLoading, error, reload } = useResource((signal) => listApprovals({ status: status(), category, page: page.value }, signal), {
    watch: [status, page],
  });
  const rows = computed(() => data.value?.items ?? []);
  const isPaged = computed(() => data.value != null && (data.value.total > data.value.pageSize || page.value > 1));

  return { page, clampTo, isPaged, data, rows, isLoading, error, reload };
}
