import { Platform } from 'react-native';

import { apiUrl, mediaUrl, request } from './client';
import type {
  AuthCheckResponse, Category, CheckoutReceipt, CheckoutRequest, DashboardSummary, LoginRequest, LoginResponse, PickedFile,
  PriceRange, Product, ProductInput, ProductListParams, ProductsByCategory, SpringPage, UUID,
} from './types';

function productQuery(params: ProductListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const authApi = {
  login: (body: LoginRequest) => request<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(body), skipUnauthorized: true }),
  check: () => request<AuthCheckResponse>('/auth/check', { skipUnauthorized: true }),
  logout: () => request<{ message: string }>('/logout', { method: 'POST', skipUnauthorized: true }),
};

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
  get: (id: UUID) => request<Category>(`/categories/${id}`),
  create: (name: string) => request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id: UUID, name: string) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  remove: (id: UUID) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: (params: ProductListParams = {}, signal?: AbortSignal) => {
    const query = productQuery(params);
    return request<SpringPage<Product>>(`/products${query ? `?${query}` : ''}`, { signal });
  },
  get: (id: UUID) => request<Product>(`/products/${id}`),
  create: (body: ProductInput | FormData) => request<Product>('/products', { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  update: (id: UUID, body: ProductInput | FormData) => request<Product>(`/products/${id}`, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  updateStock: (id: UUID, stock_quantity: number) => request<Product>(`/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock_quantity }) }),
  remove: (id: UUID) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  removeMany: (ids: UUID[]) => request<void>('/products/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  mediaType: async (photo: string) => {
    const response = await fetch(mediaUrl(photo)!, { method: 'HEAD', credentials: 'include' });
    if (!response.ok) throw new Error('Arquivo indisponível');
    return response.headers.get('Content-Type') ?? 'application/octet-stream';
  },
  downloadMedia: async (photo: string, name: string): Promise<PickedFile> => {
    const response = await fetch(mediaUrl(photo)!, { credentials: 'include' });
    if (!response.ok) throw new Error('Não foi possível baixar o arquivo atual.');
    const mimeType = response.headers.get('Content-Type') ?? 'application/octet-stream';
    const blob = await response.blob();
    const extension = mimeType === 'application/pdf' ? '.pdf' : mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : mimeType.includes('gif') ? '.gif' : '.jpg';
    const resolvedName = name.includes('.') ? name : `${name}${extension}`;
    if (Platform.OS === 'web') return { uri: mediaUrl(photo)!, name: resolvedName, mimeType, size: blob.size, file: new File([blob], resolvedName, { type: mimeType }) };
    return { uri: mediaUrl(photo)!, name: resolvedName, mimeType, size: blob.size, blob };
  },
};

export const dashboardApi = {
  summary: () => request<DashboardSummary>('/dashboard/summary'),
  productsByCategory: () => request<ProductsByCategory[]>('/dashboard/products-by-category'),
  priceRanges: () => request<PriceRange[]>('/dashboard/price-ranges'),
};

export function appendFile(form: FormData, file: PickedFile) {
  if (file.file) form.append('photo', file.file);
  else if (file.blob) form.append('photo', file.blob, file.name);
  else form.append('photo', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' } as unknown as Blob);
}

export function productFormData(input: ProductInput, file?: PickedFile) {
  const form = new FormData();
  form.append('name', input.name.trim());
  form.append('price', String(input.price));
  form.append('category_id', input.category_id);
  if (input.stock_quantity != null) form.append('stock_quantity', String(input.stock_quantity));
  if (input.cost_price != null) form.append('cost_price', String(input.cost_price));
  if (input.active != null) form.append('active', String(input.active));
  if (file) appendFile(form, file);
  return form;
}

export { apiUrl };

export const checkoutApi = {
  submit: (body: CheckoutRequest) => request<CheckoutReceipt>('/checkout', { method: 'POST', body: JSON.stringify(body), skipUnauthorized: true }),
};
