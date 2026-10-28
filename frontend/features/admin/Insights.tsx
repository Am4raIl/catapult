"use client";

import { useQuery } from "@tanstack/react-query";
import { Donut } from "@/components/Donut";
import { ProgressBar } from "@/components/ProgressBar";
import { dashboardApi } from "@/lib/api/dashboard";
import { formatCurrency } from "@/lib/format";

const rangeColors = ["var(--violet)", "var(--lime)", "var(--ink)"];

export function Insights({
  onLowStock,
}: {
  onLowStock: () => void;
}) {
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
  });
  const rangesQuery = useQuery({
    queryKey: ["dashboard", "price-ranges"],
    queryFn: dashboardApi.priceRanges,
  });
  const categoriesQuery = useQuery({
    queryKey: ["dashboard", "products-by-category"],
    queryFn: dashboardApi.productsByCategory,
  });

  const ranges = rangesQuery.data ?? [];
  const categories = [...(categoriesQuery.data ?? [])].sort(
    (a, b) => b.total_value - a.total_value,
  );
  const maxValue = categories.reduce(
    (max, category) => Math.max(max, category.total_value),
    0,
  );

  const donutLabel = ranges.length
    ? `Faixas de preço: ${ranges
        .map((range) => `${range.range}, ${range.count} produtos`)
        .join("; ")}`
    : "Faixas de preço sem dados";

  return (
    <section className="mt-5 grid gap-5 lg:grid-cols-3">
      <div className="rounded-[20px] border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">
          Faixas de preço
        </h2>
        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
          <Donut
            segments={ranges.map((range, index) => ({
              label: range.range,
              value: range.count,
              color: rangeColors[index] ?? "var(--line)",
            }))}
            ariaLabel={donutLabel}
            className="h-36 w-36 shrink-0"
          />
          <ul className="w-full min-w-0 space-y-2">
            {ranges.map((range, index) => (
              <li
                key={range.range}
                className="flex items-center justify-between gap-3 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: rangeColors[index] ?? "var(--line)",
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-muted">{range.range}</span>
                </span>
                <span className="font-bold text-ink">{range.count}</span>
              </li>
            ))}
            {ranges.length === 0 ? (
              <li className="text-[13px] text-muted">Sem dados.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-[20px] border border-line bg-surface p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">
          Valor por categoria
        </h2>
        <ul className="mt-4 space-y-4">
          {categories.map((category) => (
            <li key={category.category_id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-bold text-ink">
                  {category.category_name}
                </span>
                <span className="shrink-0 text-[13px] text-muted">
                  {formatCurrency(category.total_value)}
                </span>
              </div>
              <ProgressBar value={category.total_value} max={maxValue} />
              <p className="mt-1 text-xs text-muted">
                {category.product_count} produto
                {category.product_count === 1 ? "" : "s"}
              </p>
            </li>
          ))}
          {categories.length === 0 ? (
            <li className="text-[13px] text-muted">Sem dados.</li>
          ) : null}
        </ul>
      </div>

      <div className="on-dark rounded-[20px] bg-ink p-5 text-white">
        <h2 className="font-display text-lg font-extrabold">Atenção</h2>
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-white/85">
            <strong className="font-display text-2xl font-extrabold text-white">
              {summaryQuery.data?.low_stock_count ?? 0}
            </strong>{" "}
            produtos com estoque baixo
          </p>
          <p className="text-white/85">
            <strong className="font-display text-2xl font-extrabold text-white">
              {summaryQuery.data?.products_without_photo ?? 0}
            </strong>{" "}
            produtos sem foto
          </p>
        </div>
        <button
          type="button"
          onClick={onLowStock}
          className="mt-5 inline-flex min-h-11 items-center rounded-xl text-sm font-bold text-lime hover:underline"
        >
          Ver estoque baixo
        </button>
      </div>
    </section>
  );
}
