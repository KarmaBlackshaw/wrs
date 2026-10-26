import type { TShortageSource } from "../shortage.ts";

export const SHORTAGE_SOURCE_LABEL: Record<TShortageSource, string> = {
  trip: "Trip",
  drawer: "Drawer",
};
