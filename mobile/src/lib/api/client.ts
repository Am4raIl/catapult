import { fetch as nativeFetch } from 'whatwg-fetch';

const configuredOrigin = process.env.EXPO_PUBLIC_API_ORIGIN;
export const API_ORIGIN = configuredOrigin?.replace(/\/$/, '');

export class ApiConfigError extends Error {
  constructor() {
    super('A origem da API não foi configurada. Defina EXPO_PUBLIC_API_ORIGIN no arquivo .env.local.');
    this.name = 'ApiConfigError';
  }
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly payload: unknown) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & { skipUnauthorized?: boolean };
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function apiUrl(path: string) {
  if (!API_ORIGIN) throw new ApiConfigError();
  return `${API_ORIGIN}/api${path.startsWith('/') ? path : `/${path}`}`;
}

export function mediaUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_ORIGIN) throw new ApiConfigError();
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipUnauthorized, headers: initialHeaders, ...init } = options;
  const headers = new Headers(initialHeaders);
  if (API_ORIGIN?.includes('.loca.lt') && !headers.has('Bypass-Tunnel-Reminder')) {
    headers.set('Bypass-Tunnel-Reminder', 'true');
  }
  const isFormData = init.body instanceof FormData;
  const photo = init.body instanceof FormData ? init.body.get('photo') : null;
  if (init.body != null && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const controller = new AbortController();
  const abort = () => controller.abort();
  const timeout = setTimeout(abort, 30_000);
  if (init.signal?.aborted) abort();
  init.signal?.addEventListener('abort', abort, { once: true });
  let response: Response;
  try {
    // Expo fetch cannot serialize the URI-based FormData part from DocumentPicker.
    const hasNativeFile = photo != null && typeof photo === 'object' && 'uri' in photo;
    response = await (hasNativeFile ? nativeFetch : fetch)(apiUrl(path), { ...init, headers, signal: controller.signal, credentials: 'include' });
  } catch (cause) {
    if (cause instanceof ApiConfigError) throw cause;
    if (init.signal?.aborted) throw cause;
    if (controller.signal.aborted) throw new Error('A solicitação demorou mais que o esperado. Tente novamente.', { cause });
    const detail = cause instanceof Error && cause.message ? ` (${cause.message})` : '';
    throw new Error(`Não foi possível conectar à API${detail}.`, { cause });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abort);
  }

  if (response.status === 401 && !skipUnauthorized) onUnauthorized?.();
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function friendlyError(error: unknown) {
  if (error instanceof ApiConfigError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (error.status === 404) return 'O item solicitado não foi encontrado.';
    if (error.status === 409) return 'A operação não pôde ser concluída por um conflito.';
    if (error.status === 413) return 'O arquivo é maior que o limite permitido.';
    if (error.status === 415) return 'O formato enviado não é aceito.';
    if (error.status >= 500) return 'O servidor encontrou um problema. Tente novamente.';
    return 'Não foi possível concluir a solicitação.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Não foi possível conectar à API. Verifique o endereço configurado e sua rede.';
}
