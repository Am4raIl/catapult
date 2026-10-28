"use client";

import { Tag } from "@/components/Tag";
import { Thumb } from "@/components/Thumb";
import type { Product } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { getStorefrontStatus } from "@/lib/product-status";

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  const status = getStorefrontStatus(product.stock_quantity);

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="group flex w-full flex-col rounded-[20px] border border-line bg-surface p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(23,21,59,.10)]"
      aria-label={`Ver detalhes de ${product.name}`}
    >
      <div className="relative aspect-[4/3] w-full">
        <Thumb
          id={product.id}
          photo={product.photo}
          alt={product.name}
          className="h-full w-full"
          roundedClass="rounded-[14px]"
        />
        <span className="absolute bottom-2 left-2">
          <Tag variant={status.variant}>{status.label}</Tag>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <p className="text-[13px] text-muted">{product.category.name}</p>
        <p className="mt-1 line-clamp-2 font-bold text-ink">{product.name}</p>
        <p className="mt-3 font-display text-xl font-extrabold text-ink">
          {formatCurrency(product.price)}
        </p>
      </div>
    </button>
  );
}
