export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface RequestOptions extends RequestInit {
  skipUnauthorized?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

const API_BASE = "/api";

export async function request<T>(
  path: string,
  init: RequestOptions = {},
): Promise<T> {
  const { skipUnauthorized, headers: initialHeaders, ...rest } = init;
  const headers = new Headers(initialHeaders);
  const isFormData =
    typeof FormData !== "undefined" && rest.body instanceof FormData;

  if (rest.body != null && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipUnauthorized) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchBlob(path: string): Promise<Blob> {
  const response = await fetch(path, { credentials: "include" });

  if (!response.ok) {
    throw new ApiError(response.status, null);
  }

  return response.blob();
}
