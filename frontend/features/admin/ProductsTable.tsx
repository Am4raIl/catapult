"use client";

import {
  keepPreviousData,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { Tag } from "@/components/Tag";
import { Thumb } from "@/components/Thumb";
import { categoriesApi } from "@/lib/api/categories";
import { dashboardApi } from "@/lib/api/dashboard";
import { productsApi } from "@/lib/api/products";
import type {
  Product,
  StockStatusApi,
} from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { getAdminStatus } from "@/lib/product-status";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { StockStepper } from "./StockStepper";

export type AdminStockFilter = "ALL" | StockStatusApi;

export interface AdminTableFilters {
  status: AdminStockFilter;
  search: string;
  categoryId: string;
  page: number;
}

const PAGE_SIZE = 10;

const statusOptions: {
  value: AdminStockFilter;
  label: string;
  apiStatus?: StockStatusApi;
}[] = [
  { value: "ALL", label: "Todos" },
  { value: "OUT_OF_STOCK", label: "Esgotado", apiStatus: "OUT_OF_STOCK" },
  { value: "LOW_STOCK", label: "Baixo", apiStatus: "LOW_STOCK" },
  { value: "IN_STOCK", label: "Em estoque", apiStatus: "IN_STOCK" },
];

export function ProductsTable({
  filters,
  onChange,
  onView,
  onEdit,
  onDelete,
}: {
  filters: AdminTableFilters;
  onChange: (next: AdminTableFilters) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
  });

  const countQueries = useQueries({
    queries: statusOptions
      .filter((option) => option.apiStatus)
      .map((option) => ({
        queryKey: ["products", "admin-count", option.apiStatus],
        queryFn: () =>
          productsApi.list({
            size: 1,
            stock_status: option.apiStatus,
          }),
        select: (page: { totalElements: number }) => page.totalElements,
      })),
  });

  const countByStatus: Record<string, number | undefined> = {
    OUT_OF_STOCK: countQueries[0]?.data,
    LOW_STOCK: countQueries[1]?.data,
    IN_STOCK: countQueries[2]?.data,
  };

  const productsQuery = useQuery({
    queryKey: [
      "products",
      "admin",
      {
        status: filters.status,
        search: debouncedSearch,
        categoryId: filters.categoryId,
        page: filters.page,
      },
    ],
    queryFn: () =>
      productsApi.list({
        page: filters.page,
        size: PAGE_SIZE,
        nome: debouncedSearch.trim() || undefined,
        category_id: filters.categoryId || undefined,
        stock_status:
          filters.status === "ALL" ? undefined : filters.status,
      }),
    placeholderData: keepPreviousData,
  });

  const page = productsQuery.data;

  function update(next: Partial<AdminTableFilters>) {
    onChange({ ...filters, ...next });
  }

  return (
    <section
      id="produtos"
      className="mt-5 rounded-[20px] border border-line bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">
              Produtos
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">
              Gerencie estoque, preços e dados do catálogo.
            </p>
          </div>

          <Button
            variant="ghost"
            className="self-start lg:hidden"
            onClick={() => setMobileFiltersOpen((open) => !open)}
          >
            {mobileFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
        </div>

        <div
          className={`${
            mobileFiltersOpen ? "flex" : "hidden"
          } flex-col gap-3 lg:flex`}
        >
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const count =
                option.value === "ALL"
                  ? summaryQuery.data?.total_products
                  : countByStatus[option.value];
              return (
                <Chip
                  key={option.value}
                  active={filters.status === option.value}
                  onClick={() => update({ status: option.value, page: 0 })}
                >
                  {option.label}
                  {count != null ? (
                    <span className="ml-1.5 opacity-75">({count})</span>
                  ) : null}
                </Chip>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <label htmlFor="admin-product-search" className="sr-only">
                Buscar produtos por nome
              </label>
              <input
                id="admin-product-search"
                type="search"
                value={filters.search}
                onChange={(event) =>
                  update({ search: event.target.value, page: 0 })
                }
                placeholder="Buscar por nome"
                className="h-11 w-full rounded-xl border border-line-input bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-muted/70"
              />
            </div>

            <div className="sm:w-56">
              <label htmlFor="admin-category" className="sr-only">
                Filtrar por categoria
              </label>
              <select
                id="admin-category"
                value={filters.categoryId}
                onChange={(event) =>
                  update({ categoryId: event.target.value, page: 0 })
                }
                className="h-11 w-full rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink"
              >
                <option value="">Todas as categorias</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line-soft text-xs font-bold text-muted">
                <th className="w-14 px-2 py-3" scope="col">
                  <span className="sr-only">Miniatura</span>
                </th>
                <th className="px-2 py-3" scope="col">
                  Produto
                </th>
                <th className="px-2 py-3" scope="col">
                  Preço
                </th>
                <th className="px-2 py-3" scope="col">
                  Estoque
                </th>
                <th className="px-2 py-3" scope="col">
                  Status
                </th>
                <th className="px-2 py-3 text-right" scope="col">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {productsQuery.isPending ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-line-soft">
                    <td className="px-2 py-3" colSpan={6}>
                      <div className="h-11 animate-pulse rounded-xl bg-line-soft" />
                    </td>
                  </tr>
                ))
              ) : productsQuery.isError ? (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center">
                    <p className="font-bold text-ink">
                      Não foi possível carregar os produtos.
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-3"
                      onClick={() => productsQuery.refetch()}
                    >
                      Tentar novamente
                    </Button>
                  </td>
                </tr>
              ) : page && page.content.length > 0 ? (
                page.content.map((product) => {
                  const status = getAdminStatus(product.stock_quantity);
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-line-soft last:border-0"
                    >
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => onView(product)}
                          aria-label={`Ver ${product.name}`}
                          className="rounded-2xl"
                        >
                          <Thumb
                            id={product.id}
                            photo={product.photo}
                            alt={product.name}
                            className="h-11 w-11"
                            roundedClass="rounded-xl"
                          />
                        </button>
                      </td>
                      <td className="max-w-[260px] px-2 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onView(product)}
                            className="truncate text-left text-sm font-bold text-ink hover:text-violet"
                          >
                            {product.name}
                          </button>
                          {!product.active ? (
                            <Tag variant="neutral">Inativo</Tag>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {product.category.name}
                        </p>
                      </td>
                      <td className="px-2 py-3 text-sm text-ink">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-2 py-3">
                        <StockStepper product={product} />
                      </td>
                      <td className="px-2 py-3">
                        <Tag variant={status.variant}>{status.label}</Tag>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEdit(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(product)}
                            aria-label={`Excluir ${product.name}`}
                            className="text-danger"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center">
                    <p className="font-bold text-ink">
                      Nenhum produto encontrado
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      Ajuste a busca ou os filtros.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {page ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
            <p className="text-[13px] text-muted">
              Página {page.number + 1} de {Math.max(page.totalPages, 1)} ·{" "}
              {page.totalElements} itens
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => update({ page: Math.max(0, filters.page - 1) })}
                disabled={page.first}
                aria-label="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => update({ page: filters.page + 1 })}
                disabled={page.last}
                aria-label="Próxima página"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
