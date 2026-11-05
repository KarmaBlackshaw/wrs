import type { TApprovalStatus } from "@wrs/contract/approval";

import type { TTableColumn } from "@/types";

const COMPACT_COLUMNS: TTableColumn[] = [{ key: "compact", label: "Request" }];

export function useApprovalColumns(status: () => TApprovalStatus, { pending, handled }: { pending: TTableColumn[]; handled: TTableColumn[] }) {
  const isWide = useMediaQuery("(min-width: 640px)");
  const isPending = computed(() => status() === "pending");

  const columns = computed(() => {
    if (!isWide.value) {
      return COMPACT_COLUMNS;
    }

    return isPending.value ? pending : handled;
  });

  return { columns, isPending };
}
