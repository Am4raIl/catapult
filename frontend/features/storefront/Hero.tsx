"use client";

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CatapultMark,
  PackageIcon,
} from "@/components/icons";
import { Thumb } from "@/components/Thumb";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/api/types";

export function Hero({
  products,
  onOpen,
}: {
  products: Product[];
  onOpen: (product: Product) => void;
}) {
  return (
    <section
      className="store-hero relative isolate mt-6 overflow-hidden rounded-[28px] sm:mt-8 sm:rounded-[36px]"
      aria-labelledby="hero-title"
    >
      <div className="hero-copy relative z-10">
        <p className="hero-eyebrow flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-violet">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Escolhas que
          movem você
        </p>
        <h1
          id="hero-title"
          className="mt-6 font-display font-bold tracking-[-0.055em]"
        >
          Boas escolhas.
          <br />
          <span className="text-violet">Novas possibilidades.</span>
        </h1>
        <p className="mt-6 max-w-[390px] text-[15px] leading-relaxed text-muted sm:text-base">
          Encontre o que combina com o seu dia.
          <br className="hidden sm:block" /> Explore, descubra e escolha seu
          próximo favorito.
        </p>
        <a
          href="#catalogo"
          className="hero-cta mt-8 inline-flex min-h-12 items-center gap-7 rounded-full bg-violet py-3 pl-6 pr-4 text-sm font-bold text-white"
        >
          Explorar catálogo <ArrowRightIcon className="h-5 w-5" />
        </a>
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted sm:mt-12">
          <span className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4" /> Disponibilidade no catálogo
          </span>
          <span
            className="hidden h-3 w-px bg-line sm:block"
            aria-hidden="true"
          />
          <span>Encontre. Escolha. Catapult.</span>
        </div>
      </div>
      <div className="hero-scene" aria-hidden="true">
        <div className="hero-orbit hero-orbit-outer" />
        <div className="hero-orbit hero-orbit-inner" />
        <div className="hero-emblem">
          <CatapultMark className="h-full w-full" />
        </div>
        <span className="hero-spark hero-spark-one">+</span>
        <span className="hero-spark hero-spark-two">+</span>
        <span className="hero-orbit-dot" />
      </div>
      {products.length > 0 ? (
        <div className="hero-featured">
          {products.slice(0, 2).map((product, index) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onOpen(product)}
              className={`hero-product hero-product-${index} rounded-[22px] border border-line bg-surface p-2.5 text-left`}
              aria-label={`Descobrir ${product.name}`}
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-[14px]">
                <Thumb
                  id={product.id}
                  photo={product.photo}
                  alt={product.name}
                  className="h-full w-full"
                  roundedClass="rounded-[14px]"
                />
                <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink">
                  <ArrowUpRightIcon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 truncate px-1 text-xs text-muted">
                {product.category.name}
              </p>
              <p className="mt-1 truncate px-1 font-display text-sm font-bold text-ink">
                {product.name}
              </p>
              <p className="mb-1 mt-2 px-1 font-display text-lg font-bold text-ink">
                {formatCurrency(product.price)}
              </p>
            </button>
          ))}
          <span className="hero-caption text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Descubra algo novo ↗
          </span>
        </div>
      ) : null}
    </section>
  );
}
