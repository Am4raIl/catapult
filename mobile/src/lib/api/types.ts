export type UUID = string;
export type StockStatusApi = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

export interface LoginRequest { username: string; password: string }
export interface LoginResponse { message: string; username: string }
export interface AuthCheckResponse { authenticated: true; username: string }
export interface CategorySummary { id: UUID; name: string }
export interface ProductSummary { id: UUID; name: string; price: number; photo: string | null }
export interface Category { id: UUID; name: string; products: ProductSummary[] }
export interface Product {
  id: UUID;
  name: string;
  price: number;
  category: CategorySummary;
  photo: string | null;
  stock_quantity: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
  active: boolean;
}
export interface ProductInput {
  name: string;
  price: number;
  category_id: UUID;
  stock_quantity?: number | null;
  cost_price?: number | null;
  active?: boolean | null;
}
export interface SpringSort { sorted: boolean; unsorted: boolean; empty: boolean }
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
  pageable: { pageNumber: number; pageSize: number; offset: number; paged: boolean; unpaged: boolean; sort: SpringSort };
  sort: SpringSort;
}
export interface DashboardSummary {
  total_products: number;
  total_categories: number;
  total_inventory_value: number;
  average_product_price: number;
  products_without_photo: number;
  low_stock_count: number;
}
export interface ProductsByCategory { category_id: UUID; category_name: string; product_count: number; total_value: number }
export interface PriceRange { range: string; count: number }
export interface ProductListParams {
  page?: number;
  size?: number;
  nome?: string;
  category_id?: UUID;
  min_price?: number;
  max_price?: number;
  has_photo?: boolean;
  stock_status?: StockStatusApi;
  sort?: string;
}
export type PickedFile = { uri: string; name: string; mimeType?: string; size?: number; file?: File; blob?: Blob };
