"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { SearchIcon } from "@/components/icons";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductListParams } from "@/lib/api/types";
import { parseDecimalInput } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Filters, type StorefrontFilterValues } from "./Filters";
import { ProductCard } from "./ProductCard";
import { ProductViewModal } from "@/features/products/ProductViewModal";

const PAGE_SIZE = 12;

const initialFilters: StorefrontFilterValues = {
  minPrice: "",
  maxPrice: "",
  inStock: false,
  hasPhoto: false,
  sort: "name,asc",
};

export function StorefrontPage({ initialName }: { initialName: string }) {
  const [search, setSearch] = useState(initialName);
  const [categoryId, setCategoryId] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState<Product | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const minPrice = filters.minPrice.trim()
    ? parseDecimalInput(filters.minPrice)
    : undefined;
  const maxPrice = filters.maxPrice.trim()
    ? parseDecimalInput(filters.maxPrice)
    : undefined;

  const invalidNumber =
    (minPrice != null && Number.isNaN(minPrice)) ||
    (maxPrice != null && Number.isNaN(maxPrice));
  const invalidRange =
    minPrice != null &&
    maxPrice != null &&
    !Number.isNaN(minPrice) &&
    !Number.isNaN(maxPrice) &&
    minPrice > maxPrice;
  const priceError = invalidNumber
    ? "Informe um preço válido."
    : invalidRange
      ? "O preço mínimo não pode ser maior que o máximo."
      : null;

  const queryParams = useMemo<ProductListParams>(
    () => ({
      nome: debouncedSearch.trim() || undefined,
      category_id: categoryId || undefined,
      min_price:
        !invalidNumber && !invalidRange && minPrice != null
          ? minPrice
          : undefined,
      max_price:
        !invalidNumber && !invalidRange && maxPrice != null
          ? maxPrice
          : undefined,
      has_photo: filters.hasPhoto ? true : undefined,
      stock_status: filters.inStock ? "IN_STOCK" : undefined,
      sort: filters.sort,
    }),
    [
      debouncedSearch,
      categoryId,
      filters.hasPhoto,
      filters.inStock,
      filters.sort,
      invalidNumber,
      invalidRange,
      maxPrice,
      minPrice,
    ],
  );

  const productsQuery = useInfiniteQuery({
    queryKey: ["products", "storefront", queryParams],
    queryFn: ({ pageParam }) =>
      productsApi.list({
        ...queryParams,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    placeholderData: keepPreviousData,
  });

  const products =
    productsQuery.data?.pages
      .flatMap((page) => page.content)
      .filter((product) => product.active) ?? [];

  const lastPage = productsQuery.data?.pages.at(-1);
  const loadedPages = productsQuery.data?.pages.length ?? 0;

  function changeFilters(next: Partial<StorefrontFilterValues>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <main className="min-h-screen bg-ground pb-16">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="font-display text-2xl font-extrabold text-violet"
          >
            Catapult
          </Link>

          <div className="relative order-3 w-full sm:order-none sm:ml-6 sm:max-w-[520px] sm:flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <label htmlFor="storefront-search" className="sr-only">
              Buscar produtos
            </label>
            <input
              id="storefront-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produtos"
              className="h-11 w-full rounded-xl border border-line-input bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-muted/70"
            />
          </div>

          <Link
            href="/admin"
            className="ml-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-line-input bg-surface px-4 text-sm font-bold text-ink transition hover:bg-ground"
          >
            Área do administrador
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <section className="on-dark relative mt-6 overflow-hidden rounded-[28px] bg-ink p-7 text-white sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(91,61,245,0.8), transparent 68%)",
            }}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <h1 className="font-display text-[32px] font-extrabold leading-[1.05] sm:text-[44px]">
              Tudo o que você procura, em estoque.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] text-white/75">
              Explore o catálogo, filtre por categoria e encontre o produto
              certo para você.
            </p>
          </div>
        </section>

        <section id="categorias" className="mt-6">
          <h2 className="sr-only">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            <Chip active={!categoryId} onClick={() => setCategoryId("")}>
              Todas
            </Chip>
            {categoriesQuery.data?.map((category) => (
              <Chip
                key={category.id}
                active={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[20px] border border-line bg-surface p-4 sm:p-5">
          <Filters
            values={filters}
            priceError={priceError}
            onChange={changeFilters}
          />
        </section>

        <section className="mt-8" aria-busy={productsQuery.isPending}>
          {productsQuery.isPending ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-[20px] border border-line bg-surface"
                />
              ))}
            </div>
          ) : productsQuery.isError ? (
            <div className="rounded-[20px] border border-line bg-surface p-8 text-center">
              <p className="font-bold text-ink">
                Não foi possível carregar os produtos.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => productsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface p-10 text-center">
              <p className="font-display text-2xl font-extrabold text-ink">
                Nenhum produto encontrado
              </p>
              <p className="mt-2 text-[13px] text-muted">
                Ajuste a busca ou os filtros para ver outros produtos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={setSelected}
                />
              ))}
            </div>
          )}
        </section>

        {lastPage && lastPage.totalPages > 0 ? (
          <div className="mt-8 flex justify-center">
            <Button
              variant="secondary"
              disabled={!productsQuery.hasNextPage}
              loading={productsQuery.isFetchingNextPage}
              onClick={() => productsQuery.fetchNextPage()}
            >
              {productsQuery.hasNextPage
                ? `Carregar mais · página ${loadedPages} de ${lastPage.totalPages}`
                : "Todas as páginas carregadas"}
            </Button>
          </div>
        ) : null}
      </div>

      {selected ? (
        <ProductViewModal
          product={selected}
          mode="public"
          onClose={() => setSelected(null)}
        />
      ) : null}
    </main>
  );
}
