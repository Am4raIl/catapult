"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AdminShell } from "./AdminShell";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { ProgressBar } from "@/components/ProgressBar";
import {
  ArrowUpRightIcon,
  PackageIcon,
  SearchIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { categoriesApi } from "@/lib/api/categories";
import { dashboardApi } from "@/lib/api/dashboard";
import type { Category } from "@/lib/api/types";
import { CategoryFormModal } from "@/features/categories/CategoryFormModal";
import { CategoryViewModal } from "@/features/categories/CategoryViewModal";
import { CategoryDeleteModal } from "@/features/categories/CategoryDeleteModal";
import {
  formatCompactCurrency,
  formatCurrency,
  formatPercentage,
} from "@/lib/format";

type CategoryModalState =
  | { type: "create" }
  | { type: "view" | "edit" | "delete"; category: Category }
  | null;

export function CategoriesDashboard() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("value");
  const [modal, setModal] = useState<CategoryModalState>(null);

  function revealSaved(category: Category) {
    setSearch("");
    requestAnimationFrame(() =>
      document.getElementById(`category-${category.id}`)?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
  }
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });
  const metrics = useQuery({
    queryKey: ["dashboard", "products-by-category"],
    queryFn: dashboardApi.productsByCategory,
  });
  const rows = (categories.data ?? []).map((category) => {
    const metric = metrics.data?.find((row) => row.category_id === category.id);
    const prices = category.products.map((product) => product.price);
    return {
      ...category,
      count: category.products.length,
      value: metric?.total_value ?? 0,
      average: prices.length
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0,
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  });
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);
  const totalProducts = rows.reduce((sum, row) => sum + row.count, 0);
  const visible = rows
    .filter((row) =>
      row.name
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "pt-BR")
        : sort === "products"
          ? b.count - a.count || a.name.localeCompare(b.name)
          : b.value - a.value || a.name.localeCompare(b.name),
    );
  const pending = categories.isPending || metrics.isPending;
  const error = categories.isError || metrics.isError;
  const kpis = [
    ["Categorias", String(rows.length)],
    ["Produtos cadastrados", String(totalProducts)],
    ["Valor total em estoque", formatCompactCurrency(totalValue)],
    [
      "Categorias sem produtos",
      String(rows.filter((row) => row.count === 0).length),
    ],
  ];
  return (
    <AdminShell
      title="Categorias"
      description="Organização do catálogo e participação de cada categoria no estoque."
      action={
        <Button onClick={() => setModal({ type: "create" })}>
          <PlusIcon className="h-4 w-4" />
          Nova categoria
        </Button>
      }
    >
      {pending ? (
        <div
          className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Carregando categorias"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-line-soft"
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="mt-7 rounded-2xl border border-line bg-surface p-8 text-center"
          role="alert"
        >
          <p>Não foi possível carregar as categorias e seus indicadores.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              void categories.refetch();
              void metrics.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <section
            aria-label="Indicadores das categorias"
            className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {kpis.map(([label, value]) => (
              <div
                key={label}
                className="rounded-[20px] border border-line bg-surface p-5"
              >
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                  {value}
                </p>
              </div>
            ))}
          </section>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">
                Uma visão de cada categoria.
              </h2>
              <p className="mt-1 text-xs text-muted">
                Inclui produtos ativos e inativos. Os valores consideram preço ×
                quantidade em estoque.
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-64">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <label htmlFor="category-search" className="sr-only">
                  Buscar categoria
                </label>
                <input
                  id="category-search"
                  type="search"
                  placeholder="Buscar categoria"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-11 w-full rounded-xl border border-line-input bg-surface pl-10 pr-3 text-sm"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="category-sort">
                  Ordenar categorias
                </label>
                <select
                  id="category-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="h-11 max-w-full rounded-xl border border-line-input bg-surface px-3 text-sm"
                >
                  <option value="value">Maior valor em estoque</option>
                  <option value="products">Mais produtos</option>
                  <option value="name">Nome A–Z</option>
                </select>
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs text-muted" role="status">
            {visible.length}{" "}
            {visible.length === 1 ? "categoria exibida" : "categorias exibidas"}
          </p>
          <section
            className="mt-4 grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
            aria-label="Categorias e indicadores"
          >
            {visible.map((row) => (
              <article
                key={row.id}
                id={`category-${row.id}`}
                className="min-w-0 rounded-[24px] border border-line bg-surface p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info text-info-ink">
                    <PackageIcon className="h-5 w-5" />
                  </span>
                  <Tag variant={row.count > 0 ? "info" : "neutral"}>
                    {row.count} {row.count === 1 ? "produto" : "produtos"}
                  </Tag>
                </div>
                <h3 className="mt-5 break-words font-display text-xl font-bold">
                  {row.name}
                </h3>
                <p className="mt-5 text-xs text-muted">Valor em estoque</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                  {formatCurrency(row.value)}
                </p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between gap-2 text-xs text-muted">
                    <span>Participação no estoque</span>
                    <span className="font-bold text-ink">
                      {formatPercentage(row.value, totalValue)}
                    </span>
                  </div>
                  <ProgressBar value={row.value} max={totalValue} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-xs">
                  <div>
                    <dt className="text-muted">Preço médio</dt>
                    <dd className="mt-1 font-bold">
                      {row.count ? formatCurrency(row.average) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Faixa de preços</dt>
                    <dd className="mt-1 font-bold">
                      {row.count
                        ? `${formatCurrency(row.min)} – ${formatCurrency(row.max)}`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-0 flex-1"
                    onClick={() => setModal({ type: "view", category: row })}
                    aria-label={`Visualizar categoria ${row.name}`}
                  >
                    <EyeIcon className="h-4 w-4 shrink-0" />
                    Visualizar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-w-0 flex-1"
                    onClick={() => setModal({ type: "edit", category: row })}
                    aria-label={`Editar categoria ${row.name}`}
                  >
                    <PencilIcon className="h-4 w-4 shrink-0" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 border border-line !text-danger hover:!border-danger/30 hover:!bg-error"
                    onClick={() => setModal({ type: "delete", category: row })}
                    aria-label={`Excluir categoria ${row.name}`}
                    title="Excluir categoria"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Link
                  href={`/admin?categoria=${encodeURIComponent(row.id)}#produtos`}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-muted hover:text-violet"
                >
                  Ver produtos <ArrowUpRightIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </section>
          {visible.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-surface p-10 text-center">
              <p className="font-bold">
                {search
                  ? "Nenhuma categoria encontrada."
                  : "Seu catálogo ainda não tem categorias."}
              </p>
              {search ? (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setSearch("")}
                >
                  Limpar busca
                </Button>
              ) : (
                <Button
                  className="mt-4"
                  onClick={() => setModal({ type: "create" })}
                >
                  <PlusIcon className="h-4 w-4" />
                  Criar primeira categoria
                </Button>
              )}
            </div>
          ) : null}
        </>
      )}
      {modal?.type === "create" || modal?.type === "edit" ? (
        <CategoryFormModal
          category={modal.type === "edit" ? modal.category : undefined}
          onClose={() => setModal(null)}
          onSaved={revealSaved}
        />
      ) : null}
      {modal?.type === "view" ? (
        <CategoryViewModal
          category={modal.category}
          onClose={() => setModal(null)}
          onEdit={(category) => setModal({ type: "edit", category })}
        />
      ) : null}
      {modal?.type === "delete" ? (
        <CategoryDeleteModal
          category={modal.category}
          onClose={() => setModal(null)}
        />
      ) : null}
    </AdminShell>
  );
}
