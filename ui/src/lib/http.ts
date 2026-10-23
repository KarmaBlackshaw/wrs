import axios from "axios";

import { ROUTES } from "@/types";
import { router } from "@/lib/router";

export const http = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL,
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore().logout();
      router.push({ path: ROUTES.LOGIN, query: { redirect: router.currentRoute.value.fullPath } });
    }

    return Promise.reject(error);
  }
);
