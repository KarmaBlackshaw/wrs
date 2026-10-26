import axios from "axios";
import { START_LOCATION } from "vue-router";
import type { TApiError, TErrorCode } from "@wrs/contract/common";

import { ROUTES } from "@/types";
import { router } from "@/lib/router";

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection.";

export class ApiError extends Error {
  status: number;
  code: TErrorCode | "network";
  details?: Record<string, unknown>;

  constructor({ status, code, message, details }: { status: number; code: TErrorCode | "network"; message: string; details?: Record<string, unknown> }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(data: unknown): data is TApiError {
  return typeof data === "object" && data != null && "code" in data && typeof data.code === "string" && "message" in data && typeof data.message === "string";
}

async function readErrorBody(data: unknown): Promise<unknown> {
  if (data instanceof Blob && data.type.startsWith("application/json")) {
    return JSON.parse(await data.text());
  }

  return data;
}

async function toApiError(error: unknown) {
  if (!axios.isAxiosError(error) || error.response == null) {
    return new ApiError({ status: 0, code: "network", message: NETWORK_ERROR_MESSAGE });
  }

  const { status } = error.response;
  const data = await readErrorBody(error.response.data);

  if (isApiErrorBody(data)) {
    return new ApiError({ status, code: data.code, message: data.message, details: data.details });
  }

  return new ApiError({ status, code: "internal", message: error.message });
}

export const http = axios.create({
  timeout: 15_000,
  baseURL: import.meta.env.VITE_APP_API_URL,
});

http.interceptors.request.use((config) => {
  const authStore = useAuthStore();

  if (authStore.token != null) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }

  if (authStore.activeRole != null) {
    config.headers["X-Active-Role"] = authStore.activeRole;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const apiError = await toApiError(error);

    if (apiError.status === 401) {
      const authStore = useAuthStore();
      const currentRoute = router.currentRoute.value;

      authStore.logout({ isForced: true });

      if (currentRoute !== START_LOCATION && currentRoute.path !== ROUTES.LOGIN) {
        router.push({ path: ROUTES.LOGIN, query: { redirect: currentRoute.fullPath } });
      }
    }

    return Promise.reject(apiError);
  }
);
