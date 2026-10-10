import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

import { barrels } from "./plugins/barrels";

export default defineConfig({
  plugins: [
    barrels(["src/types", "src/utils", "src/components", "src/lib"]),
    tailwindcss(),
    VueRouter({
      routesFolder: "src/pages",
      dts: "typed-router.d.ts",
    }),
    // Vue must be placed AFTER VueRouter()
    Vue(),
    AutoImport({
      dirs: ["./src/composables", "./src/utils", "./src/types/labels", "./src/stores"],
      imports: ["pinia", "vue", "vue-router", "@vueuse/core"],
      vueTemplate: true,
      dts: true,
      eslintrc: {
        enabled: true,
        filepath: "./auto-import.json",
        globalsPropValue: true,
      },
    }),
    Components({
      dts: true,
      deep: true,
      directoryAsNamespace: true,
      collapseSamePrefixes: true,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
