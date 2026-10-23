import { createRouter, createWebHistory } from "vue-router";
import { routes, handleHotUpdate } from "vue-router/auto-routes";

import type { Middleware } from "@/types";

const DEFAULT_TITLE = "WRS";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

// Runs in filename order (00.x, 01.x…); the first middleware to return a redirect or `false` wins.
const middlewares = import.meta.glob<Middleware>("@/middlewares/*.ts", { eager: true, import: "default" });

router.beforeEach(async (to, from) => {
  for (const middleware of Object.values(middlewares)) {
    const result = await middleware(to, from);

    if (result !== undefined && result !== true) {
      return result;
    }
  }
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${DEFAULT_TITLE} | ${to.meta.title}` : DEFAULT_TITLE;
});
