import type { TLabTest } from "@wrs/contract/water";

import type { TTone } from "@/types/ui";

type TLabTestDueStatus = NonNullable<TLabTest["dueStatus"]>;

export const LAB_TEST_DUE_TONE: Record<TLabTestDueStatus, TTone> = { not_due: "ok", due: "warn", overdue: "danger" };

export const LAB_TEST_DUE_LABEL: Record<TLabTestDueStatus, string> = { not_due: "Not due", due: "Due soon", overdue: "Overdue" };
