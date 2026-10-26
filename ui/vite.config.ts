import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { VitePWA } from "vite-plugin-pwa";

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
      dirs: ["./src/composables", "./src/utils/**", "./src/types/labels", "./src/stores"],
      imports: ["pinia", "vue", "vue-router", "@vueuse/core", { "@vueuse/router": ["useRouteQuery"] }],
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
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      manifest: {
        name: "WRS",
        short_name: "WRS",
        start_url: "/",
        display: "standalone",
        theme_color: "#00786f",
        background_color: "#00786f",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
