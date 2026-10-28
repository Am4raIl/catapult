import { request } from "./client";
import type {
  DashboardSummary,
  PriceRange,
  ProductsByCategory,
} from "./types";

export const dashboardApi = {
  summary: () => request<DashboardSummary>("/dashboard/summary"),

  productsByCategory: () =>
    request<ProductsByCategory[]>("/dashboard/products-by-category"),

  priceRanges: () => request<PriceRange[]>("/dashboard/price-ranges"),
};
