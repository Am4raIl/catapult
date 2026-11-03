import { request } from "./client";
import type { CheckoutReceipt, CheckoutRequest } from "./types";

export const checkoutApi = {
  submit: (body: CheckoutRequest) =>
    request<CheckoutReceipt>("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    }),
};
