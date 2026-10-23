import type { TSaleRow } from "@/types/entities/sale";

export const SALE_SOURCE_LABEL: Record<TSaleRow["source"], string> = {
  walk_in: "Walk-in",
  delivery: "Delivery",
};
