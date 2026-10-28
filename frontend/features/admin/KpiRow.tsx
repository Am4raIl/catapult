"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";
import {
  formatCompactCurrency,
  formatCurrency,
} from "@/lib/format";

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="min-w-[140px] flex-1 basis-[150px] rounded-[20px] border border-line bg-surface px-4 py-3.5">
      <p className="text-xs font-bold text-muted">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded-full bg-line" />
      ) : (
        <p className="mt-1 font-display text-2xl font-extrabold text-ink">
          {value}
        </p>
      )}
    </div>
  );
}

export function KpiRow() {
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
  });

  return (
    <section
      className="flex flex-wrap gap-3"
      aria-label="Indicadores do painel"
    >
      <KpiCard
        label="Produtos"
        value={String(data?.total_products ?? 0)}
        loading={isPending}
      />
      <KpiCard
        label="Categorias"
        value={String(data?.total_categories ?? 0)}
        loading={isPending}
      />
      <KpiCard
        label="Valor em estoque"
        value={formatCompactCurrency(data?.total_inventory_value)}
        loading={isPending}
      />
      <KpiCard
        label="Preço médio"
        value={formatCurrency(data?.average_product_price)}
        loading={isPending}
      />
      <KpiCard
        label="Sem foto"
        value={String(data?.products_without_photo ?? 0)}
        loading={isPending}
      />
      <KpiCard
        label="Estoque baixo"
        value={String(data?.low_stock_count ?? 0)}
        loading={isPending}
      />
    </section>
  );
}
