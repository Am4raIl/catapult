"use client";

import { Chip } from "@/components/Chip";

export interface StorefrontFilterValues {
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  hasPhoto: boolean;
  sort: string;
}

export function Filters({
  values,
  priceError,
  onChange,
}: {
  values: StorefrontFilterValues;
  priceError: string | null;
  onChange: (next: Partial<StorefrontFilterValues>) => void;
}) {
  const inputClass =
    "h-11 w-full rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-[220px] flex-1 flex-wrap gap-3 sm:max-w-[340px]">
        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="min-price"
            className="mb-1.5 block text-xs font-bold text-muted"
          >
            Preço mínimo
          </label>
          <input
            id="min-price"
            inputMode="decimal"
            placeholder="R$ 0"
            value={values.minPrice}
            onChange={(event) => onChange({ minPrice: event.target.value })}
            className={inputClass}
            aria-invalid={priceError ? true : undefined}
          />
        </div>
        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="max-price"
            className="mb-1.5 block text-xs font-bold text-muted"
          >
            Preço máximo
          </label>
          <input
            id="max-price"
            inputMode="decimal"
            placeholder="R$ 10.000"
            value={values.maxPrice}
            onChange={(event) => onChange({ maxPrice: event.target.value })}
            className={inputClass}
            aria-invalid={priceError ? true : undefined}
          />
        </div>
      </div>

      <Chip
        active={values.inStock}
        onClick={() => onChange({ inStock: !values.inStock })}
      >
        Em estoque
      </Chip>

      <Chip
        active={values.hasPhoto}
        onClick={() => onChange({ hasPhoto: !values.hasPhoto })}
      >
        Com foto
      </Chip>

      <div className="ml-auto">
        <label
          htmlFor="product-sort"
          className="mb-1.5 block text-xs font-bold text-muted"
        >
          Ordenar por
        </label>
        <select
          id="product-sort"
          value={values.sort}
          onChange={(event) => onChange({ sort: event.target.value })}
          className={inputClass}
        >
          <option value="name,asc">Nome A–Z</option>
          <option value="price,asc">Menor preço</option>
          <option value="price,desc">Maior preço</option>
        </select>
      </div>

      {priceError ? (
        <p role="alert" className="w-full text-[13px] font-medium text-danger">
          {priceError}
        </p>
      ) : null}
    </div>
  );
}
