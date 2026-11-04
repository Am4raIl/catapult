import { fetchBlob, request, type RequestOptions } from "./client";
import type {
  Product,
  ProductInput,
  ProductListParams,
  SpringPage,
  UUID,
} from "./types";

export type PhotoKind = "image" | "pdf" | "other";
const photoRevisions = new Map<string, number>();
let photoRevision = 0;

function versionPhoto(product: Product): Product {
  if (!product.photo || !product.updated_at) return product;
  const [path, query] = product.photo.split("?");
  const params = new URLSearchParams(query);
  params.set("v", product.updated_at);
  const revision = photoRevisions.get(product.id);
  if (revision != null) params.set("r", String(revision));
  return { ...product, photo: `${path}?${params}` };
}

async function requestProduct(path: string, options?: RequestOptions) {
  return versionPhoto(await request<Product>(path, options));
}

async function saveProduct(path: string, options: RequestOptions) {
  const product = await request<Product>(path, options);
  photoRevisions.set(product.id, ++photoRevision);
  return versionPhoto(product);
}

function toQuery(params: ProductListParams) {
  const search = new URLSearchParams();

  if (params.page != null) search.set("page", String(params.page));
  if (params.size != null) search.set("size", String(params.size));
  if (params.nome) search.set("nome", params.nome);
  if (params.category_id) search.set("category_id", params.category_id);
  if (params.min_price != null)
    search.set("min_price", String(params.min_price));
  if (params.max_price != null)
    search.set("max_price", String(params.max_price));
  if (params.has_photo != null)
    search.set("has_photo", String(params.has_photo));
  if (params.stock_status) search.set("stock_status", params.stock_status);
  if (params.sort) search.set("sort", params.sort);
  if (params.active != null) search.set("active", String(params.active));

  return search.toString();
}

export const productsApi = {
  list: async (params: ProductListParams = {}) => {
    const page = await request<SpringPage<Product>>(
      `/products?${toQuery(params)}`,
    );
    return { ...page, content: page.content.map(versionPhoto) };
  },

  get: (id: UUID) => requestProduct(`/products/${id}`),

  createJson: (body: ProductInput) =>
    saveProduct("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  createMultipart: (body: FormData) =>
    saveProduct("/products", {
      method: "POST",
      body,
    }),

  updateJson: (id: UUID, body: ProductInput) =>
    saveProduct(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  updateMultipart: (id: UUID, body: FormData) =>
    saveProduct(`/products/${id}`, {
      method: "PUT",
      body,
    }),

  updateStock: (id: UUID, stock_quantity: number) =>
    requestProduct(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock_quantity }),
    }),

  remove: (id: UUID) => request<void>(`/products/${id}`, { method: "DELETE" }),

  removeMany: (ids: UUID[]) => request<void>("/products/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ ids }),
  }),

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
