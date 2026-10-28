import { fetchBlob, request } from "./client";
import type {
  Product,
  ProductInput,
  ProductListParams,
  SpringPage,
  UUID,
} from "./types";

export type PhotoKind = "image" | "pdf" | "other";

function toQuery(params: ProductListParams) {
  const search = new URLSearchParams();

  if (params.page != null) search.set("page", String(params.page));
  if (params.size != null) search.set("size", String(params.size));
  if (params.nome) search.set("nome", params.nome);
  if (params.category_id) search.set("category_id", params.category_id);
  if (params.min_price != null) search.set("min_price", String(params.min_price));
  if (params.max_price != null) search.set("max_price", String(params.max_price));
  if (params.has_photo != null)
    search.set("has_photo", String(params.has_photo));
  if (params.stock_status) search.set("stock_status", params.stock_status);
  if (params.sort) search.set("sort", params.sort);

  return search.toString();
}

export const productsApi = {
  list: (params: ProductListParams = {}) =>
    request<SpringPage<Product>>(`/products?${toQuery(params)}`),

  get: (id: UUID) => request<Product>(`/products/${id}`),

  createJson: (body: ProductInput) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createMultipart: (body: FormData) =>
    request<Product>("/products", {
      method: "POST",
      body,
    }),

  updateJson: (id: UUID, body: ProductInput) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateMultipart: (id: UUID, body: FormData) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body,
    }),

  updateStock: (id: UUID, stock_quantity: number) =>
    request<Product>(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock_quantity }),
    }),

  remove: (id: UUID) => request<void>(`/products/${id}`, { method: "DELETE" }),

  downloadPhoto: (photo: string) => fetchBlob(photo),

  photoKind: async (photo: string): Promise<PhotoKind> => {
    const response = await fetch(photo, {
      method: "HEAD",
      credentials: "include",
    });

    if (!response.ok) {
      return "other";
    }

    const type = (response.headers.get("content-type") ?? "").toLowerCase();

    if (type.includes("pdf")) return "pdf";
    if (type.startsWith("image/")) return "image";
    return "other";
  },
};
