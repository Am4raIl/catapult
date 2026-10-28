import type { StockStatusApi } from "@/lib/api/types";

export type StockState = "out" | "low" | "in";
export type TagVariant = "success" | "warning" | "error" | "info" | "neutral";

export function getStockState(quantity: number): StockState {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "in";
}

export function getStorefrontStatus(quantity: number): {
  label: string;
  variant: TagVariant;
} {
  const state = getStockState(quantity);

  if (state === "out") return { label: "Esgotado", variant: "error" };
  if (state === "low") return { label: "Últimas unidades", variant: "warning" };
  return { label: "Em estoque", variant: "success" };
}

export function getAdminStatus(quantity: number): {
  label: string;
  variant: TagVariant;
} {
  const state = getStockState(quantity);

  if (state === "out") return { label: "Esgotado", variant: "error" };
  if (state === "low") return { label: "Baixo", variant: "warning" };
  return { label: "Em estoque", variant: "success" };
}

export function stockStateToApi(state: StockState): StockStatusApi {
  if (state === "out") return "OUT_OF_STOCK";
  if (state === "low") return "LOW_STOCK";
  return "IN_STOCK";
}
