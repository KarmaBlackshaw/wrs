import "@/assets/style.css";

import { registerSW } from "virtual:pwa-register";

import { pinia, router } from "@/lib";

import App from "./App.vue";

const app = createApp(App).use(pinia).use(router);

router.isReady().then(() => app.mount("#app"));

registerSW({ immediate: true });
