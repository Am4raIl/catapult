import { request } from "./client";
import type { Category, UUID } from "./types";

export const categoriesApi = {
  list: () => request<Category[]>("/categories"),
  get: (id: UUID) => request<Category>(`/categories/${id}`),
  create: (body: { name: string }) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: UUID, body: { name: string }) =>
    request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: UUID) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
};
