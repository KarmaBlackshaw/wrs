import "@/assets/style.css";

import { pinia, router } from "@/lib";

import App from "./App.vue";

const app = createApp(App).use(pinia).use(router);

router.isReady().then(() => app.mount("#app"));
