import type { LayoutName } from "@/types/layout";
import type { TRole } from "@/types/roles";

declare module "vue-router" {
  interface RouteMeta {
    layout?: LayoutName;
    title?: string;
    roles?: TRole[];
  }
}
