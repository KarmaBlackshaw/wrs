import { CONTAINER_TYPE_LABEL } from "@wrs/contract/labels/container";
import type { TContainerTypeCode, TLocationKind, TMovementType } from "@wrs/contract/container";

import type { TOption } from "@/types/ui";

export { CONTAINER_TYPE_LABEL };

export const MOVEMENT_TYPE_LABEL: Record<TMovementType, string> = {
  purchased: "Purchased",
  to_rider: "To rider",
  to_customer: "To customer",
  collected: "Collected",
  returned: "Returned",
  damaged: "Damaged",
  lost: "Lost",
  retired: "Retired",
  filled: "Filled",
};

export const MOVEMENT_TYPE_OPTIONS: TOption<TMovementType>[] = [
  { value: "purchased", label: MOVEMENT_TYPE_LABEL.purchased },
  { value: "to_rider", label: MOVEMENT_TYPE_LABEL.to_rider },
  { value: "to_customer", label: MOVEMENT_TYPE_LABEL.to_customer },
  { value: "collected", label: MOVEMENT_TYPE_LABEL.collected },
  { value: "returned", label: MOVEMENT_TYPE_LABEL.returned },
  { value: "damaged", label: MOVEMENT_TYPE_LABEL.damaged },
  { value: "lost", label: MOVEMENT_TYPE_LABEL.lost },
  { value: "retired", label: MOVEMENT_TYPE_LABEL.retired },
  { value: "filled", label: MOVEMENT_TYPE_LABEL.filled },
];

export const LOCATION_KIND_LABEL: Record<TLocationKind, string> = {
  station: "Station",
  rider: "Rider",
  customer: "Customer",
  external: "External",
};

export const CONTAINER_TYPE_OPTIONS: TOption<TContainerTypeCode>[] = [
  { value: "round", label: CONTAINER_TYPE_LABEL.round },
  { value: "slim", label: CONTAINER_TYPE_LABEL.slim },
];
