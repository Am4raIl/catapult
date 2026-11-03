"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Pagination } from "@/components/Pagination";
import {
  ArrowUpRightIcon,
  BagIcon,
  CatapultMark,
  SearchIcon,
  SlidersIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/Toaster";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductListParams } from "@/lib/api/types";
import { parseDecimalInput } from "@/lib/format";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Filters, type StorefrontFilterValues } from "./Filters";
import { ProductCard } from "./ProductCard";
import { Hero } from "./Hero";
import { CartModal } from "./CartModal";
import { useCart } from "./use-cart";
import { ProductViewModal } from "@/features/products/ProductViewModal";
import { useSession } from "@/features/auth/SessionProvider";

const PAGE_SIZE = 12;

const initialFilters: StorefrontFilterValues = {
  minPrice: "",
  maxPrice: "",
  inStock: false,
  hasPhoto: false,
  sort: "name,asc",
};

export function StorefrontPage({ initialName }: { initialName: string }) {
  const { status: sessionStatus } = useSession();
  const isAdmin = sessionStatus === "authenticated";
  const [search, setSearch] = useState(initialName);
  const [categoryId, setCategoryId] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const cart = useCart();
  const toast = useToast();
  const debouncedSearch = useDebouncedValue(search, 300);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () =>
      productsApi.list({
        size: 6,
        stock_status: "IN_STOCK",
        has_photo: true,
        active: true,
      }),
    staleTime: 60_000,
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
      active: true,
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

  const productsQuery = useQuery({
    queryKey: ["products", "storefront", queryParams, page],
    queryFn: () =>
      productsApi.list({
        ...queryParams,
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const products =
    productsQuery.data?.content.filter((product) => product.active) ?? [];

  function changeFilters(next: Partial<StorefrontFilterValues>) {
    setPage(0);
    setFilters((current) => ({ ...current, ...next }));
  }

  function buy(product: Product) {
    if (cart.pending) {
      toast.info(
        "Compra em confirmação",
        "Abra a sacola para confirmar o resultado da compra anterior.",
      );
      return;
    }
    if (cart.add(product)) {
      toast.success(
        "Adicionado à sacola",
        `${product.name} já está na sua seleção.`,
      );
    } else {
      toast.info(
        "Limite de estoque",
        "Você já adicionou todas as unidades disponíveis deste produto.",
      );
    }
  }

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
    filters.hasPhoto,
    filters.sort !== initialFilters.sort,
  ].filter(Boolean).length;
  const hasFilters = Boolean(search || categoryId || activeFilterCount);

  function resetFilters() {
    setPage(0);
    setSearch("");
    setCategoryId("");
    setFilters(initialFilters);
  }

  return (
    <main className="storefront min-h-screen bg-ground">
      <a href="#catalogo" className="skip-link">
        Ir para o catálogo
      </a>
      <header className="store-header sticky top-0 z-30 border-b border-line">
        <div className="site-shell flex flex-wrap items-center gap-2 py-4 sm:gap-4 sm:py-5">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-1.5 font-display text-xl font-extrabold tracking-[-0.04em] text-ink sm:gap-2 sm:text-[25px]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white sm:h-9 sm:w-9">
              <CatapultMark className="h-6 w-6" />
            </span>
            <span>
              Catapult<span className="text-violet">.</span>
            </span>
          </Link>

          <a
            href="#catalogo"
            className="ml-5 hidden min-h-11 items-center text-sm font-semibold text-muted transition-colors hover:text-violet xl:inline-flex"
          >
            Explorar
          </a>
          <div className="relative order-3 mt-1 w-full md:order-none md:mx-auto md:mt-0 md:max-w-[580px] md:flex-1 lg:ml-8 lg:mr-auto">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <label htmlFor="storefront-search" className="sr-only">
              Buscar produtos
            </label>
            <input
              id="storefront-search"
              type="search"
              value={search}
              onChange={(event) => {
                setPage(0);
                setSearch(event.target.value);
              }}
              placeholder="O que você procura hoje?"
              className="store-search h-11 w-full rounded-full border border-line bg-ground pl-11 pr-4 text-sm text-ink placeholder:text-muted"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir sacola, ${cart.count} ${cart.count === 1 ? "item" : "itens"}`}
              className="bag-button relative inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-2 text-sm font-bold text-ink sm:px-4"
            >
              <BagIcon className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Sacola</span>
              <span
                key={cart.count}
                className="bag-count flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1 text-[10px] text-white"
                aria-live="polite"
              >
                {cart.count}
              </span>
            </button>
            {sessionStatus === "loading" ? (
              <span
                aria-hidden="true"
                className="h-11 w-16 animate-pulse rounded-full bg-line-soft"
              />
            ) : isAdmin ? (
              <Link
                href="/admin"
                className="hidden min-h-11 items-center justify-center gap-1 border-l border-line pl-4 text-xs font-semibold text-muted transition hover:text-violet lg:inline-flex"
              >
                Administração <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink transition hover:border-violet hover:bg-info hover:text-violet sm:px-5 sm:text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="site-shell">
        <Hero
          products={
            featuredQuery.data?.content.filter((product) => product.active) ??
            []
          }
          onOpen={setSelected}
        />

        <section
          id="catalogo"
          className="catalog-section scroll-mt-40 pt-12 sm:scroll-mt-28 sm:pt-16"
          aria-labelledby="catalog-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet">
                Explore o Catapult
              </p>
              <h2
                id="catalog-title"
                className="font-display text-[clamp(1.8rem,2.5vw,2.8rem)] font-bold tracking-[-0.04em]"
              >
                Seu próximo favorito.
              </h2>
            </div>
            <button
              type="button"
              className="filter-toggle inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-semibold"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filters"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <SlidersIcon className="h-4 w-4" /> Filtros
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-violet px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <nav
            id="categorias"
            className="category-list mt-7 flex gap-2 overflow-x-auto pb-2"
            aria-label="Categorias de produtos"
          >
            <Chip
              active={!categoryId}
              onClick={() => {
                setPage(0);
                setCategoryId("");
              }}
            >
              Todos os produtos
            </Chip>
            {categoriesQuery.data?.map((category) => (
              <Chip
                key={category.id}
                active={categoryId === category.id}
                onClick={() => {
                  setPage(0);
                  setCategoryId(category.id);
                }}
              >
                {category.name}
              </Chip>
            ))}
          </nav>
          {categoriesQuery.isError ? (
            <p className="mt-2 text-sm text-muted">
              Não foi possível carregar as categorias.{" "}
              <button
                type="button"
                onClick={() => categoriesQuery.refetch()}
                className="min-h-11 font-bold text-violet underline"
              >
                Tentar novamente
              </button>
            </p>
          ) : null}

          <div
            id="catalog-filters"
            className="filter-panel"
            inert={!filtersOpen}
            data-open={filtersOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="mt-4 rounded-[20px] border border-line bg-surface p-4 sm:p-5">
                <Filters
                  values={filters}
                  priceError={priceError}
                  onChange={changeFilters}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <p className="text-xs text-muted" role="status">
              {productsQuery.isFetching
                ? "Buscando sua próxima escolha…"
                : `${products.length} ${products.length === 1 ? "produto exibido" : "produtos exibidos"}`}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 text-xs font-bold text-violet hover:underline"
              >
                Limpar filtros e busca
              </button>
            ) : (
              <span className="text-xs text-muted">
                Uma escolha de cada vez.
              </span>
            )}
          </div>

          <div className="mt-5" aria-busy={productsQuery.isFetching}>
            {productsQuery.isPending ? (
              <div className="product-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[410px] animate-pulse rounded-[24px] border border-line bg-surface"
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
                <Button
                  variant="secondary"
                  className="mt-5"
                  onClick={resetFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={setSelected}
                    onBuy={buy}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {productsQuery.data ? (
          <Pagination
            page={page}
            totalPages={productsQuery.data.totalPages}
            totalElements={productsQuery.data.totalElements}
            disabled={productsQuery.isFetching}
            onChange={(next) => {
              setPage(next);
              document.getElementById("catalogo")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
                block: "start",
              });
            }}
          />
        ) : null}
        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line py-8 text-xs text-muted">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-tight text-ink"
          >
            Catapult<span className="text-violet">.</span>
          </Link>
          <span>Boas escolhas, novas possibilidades.</span>
          <Link
            href={isAdmin ? "/admin" : "/login"}
            className="inline-flex min-h-11 items-center gap-1 hover:text-violet"
          >
            {isAdmin ? "Área do administrador" : "Login"}{" "}
            <ArrowUpRightIcon className="h-3 w-3" />
          </Link>
        </footer>
      </div>

      {selected ? (
        <ProductViewModal
          product={selected}
          mode="public"
          onClose={() => setSelected(null)}
          onBuy={buy}
        />
      ) : null}
      {cartOpen ? (
        <CartModal cart={cart} onClose={() => setCartOpen(false)} />
      ) : null}
    </main>
  );
}
