import type { TProductKind } from "@wrs/contract/product";

import type { TOption } from "@/types/ui";

export const PRODUCT_KIND_LABEL: Record<TProductKind, string> = {
  refill: "Refill",
  container: "Container",
  bottled: "Bottled",
  other: "Other",
};

export const PRODUCT_KIND_OPTIONS: TOption<TProductKind>[] = [
  { value: "refill", label: PRODUCT_KIND_LABEL.refill },
  { value: "container", label: PRODUCT_KIND_LABEL.container },
  { value: "bottled", label: PRODUCT_KIND_LABEL.bottled },
  { value: "other", label: PRODUCT_KIND_LABEL.other },
];
