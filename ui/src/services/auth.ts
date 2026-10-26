import type { TLoginBody, TLoginResponse, TMe } from "@wrs/contract/auth";

import { http } from "@/lib/http";

export function login(body: TLoginBody) {
  return http.post<TLoginResponse>("/auth/login", body);
}

export function getMe() {
  return http.get<TMe>("/me");
}
