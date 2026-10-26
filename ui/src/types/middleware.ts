import type { NavigationGuardReturn, RouteLocationNormalized } from "vue-router";

export type Middleware = (to: RouteLocationNormalized, from: RouteLocationNormalized) => NavigationGuardReturn | Promise<NavigationGuardReturn>;
