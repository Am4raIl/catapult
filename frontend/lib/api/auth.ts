import { request } from "./client";
import type {
  AuthCheckResponse,
  LoginRequest,
  LoginResponse,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) =>
    request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(body),
      skipUnauthorized: true,
    }),

  check: () =>
    request<AuthCheckResponse>("/auth/check", {
      skipUnauthorized: true,
    }),

  logout: () => request<{ message: string }>("/logout", { method: "POST" }),
};
