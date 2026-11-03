"use client";

import type { PointerEvent } from "react";
import { Tag } from "@/components/Tag";
import { Thumb } from "@/components/Thumb";
import { ArrowUpRightIcon, BagIcon } from "@/components/icons";
import type { Product } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { getStorefrontStatus } from "@/lib/product-status";

export function ProductCard({
  product,
  onOpen,
  onBuy,
  index = 0,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  onBuy: (product: Product) => void;
  index?: number;
}) {
  const status = getStorefrontStatus(product.stock_quantity);
  const available = product.active && product.stock_quantity > 0;

  function tilt(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty(
      "--rotate-x",
      `${-((event.clientY - bounds.top) / bounds.height - 0.5) * 6}deg`,
    );
    card.style.setProperty(
      "--rotate-y",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}deg`,
    );
  }

  function resetTilt(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.removeProperty("--rotate-x");
    event.currentTarget.style.removeProperty("--rotate-y");
  }

  return (
    <div
      className="product-reveal"
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
    >
      <article
        className="product-card group flex h-full min-w-0 flex-col rounded-[24px] border border-line bg-surface p-3"
        onPointerMove={tilt}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
      >
        <button
          type="button"
          onClick={() => onOpen(product)}
          className="product-image relative block aspect-[4/3] w-full overflow-hidden rounded-[17px] text-left"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <Thumb
            id={product.id}
            photo={product.photo}
            alt={product.name}
            className="h-full w-full"
            roundedClass="rounded-[17px]"
          />
          <span className="absolute left-3 top-3">
            <Tag variant={status.variant}>{status.label}</Tag>
          </span>
          <span className="product-details-arrow absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-sm">
            <ArrowUpRightIcon className="h-[18px] w-[18px]" />
          </span>
        </button>

        <div className="flex flex-1 flex-col px-2 pb-2 pt-4 sm:px-3">
          <p className="truncate text-xs text-muted">{product.category.name}</p>
          <h3 className="mt-1.5 font-display text-lg font-bold leading-snug">
            <button
              type="button"
              onClick={() => onOpen(product)}
              className="min-h-11 text-left transition-colors hover:text-violet"
            >
              {product.name}
            </button>
          </h3>
          <div className="mt-auto pt-5">
            <p className="font-display text-[clamp(1.3rem,1.5vw,1.8rem)] font-bold tracking-tight tabular-nums">
              {formatCurrency(product.price)}
            </p>
            <button
              type="button"
              onClick={() => onBuy(product)}
              disabled={!available}
              className="buy-button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-ground px-4 text-sm font-bold text-ink disabled:opacity-50"
              aria-label={
                available
                  ? `Comprar ${product.name}`
                  : `${product.name} esgotado`
              }
            >
              <BagIcon className="h-4 w-4" />
              {available ? "Comprar" : "Indisponível"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
