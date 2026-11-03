"use client";

import { Chip } from "@/components/Chip";
import type { ChangeEvent, KeyboardEvent } from "react";
import { maskCurrencyInput } from "@/lib/format";

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

  function updatePrice(
    input: HTMLInputElement,
    raw: string,
    caret: number,
    field: "minPrice" | "maxPrice",
    deleting = false,
  ) {
    const digitsToRight = raw.slice(caret).replace(/\D/g, "").length;
    const formatted =
      deleting && !/[1-9]/.test(raw) ? "" : maskCurrencyInput(raw);
    onChange({ [field]: formatted });
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      let cursor = formatted.length;
      let remaining = digitsToRight;
      while (cursor > 0 && remaining > 0) {
        cursor -= 1;
        if (/\d/.test(formatted[cursor])) remaining -= 1;
      }
      input.setSelectionRange(cursor, cursor);
    });
  }

  function changePrice(
    event: ChangeEvent<HTMLInputElement>,
    field: "minPrice" | "maxPrice",
  ) {
    const input = event.currentTarget;
    updatePrice(
      input,
      input.value,
      input.selectionStart ?? input.value.length,
      field,
      (event.nativeEvent as InputEvent).inputType?.startsWith("delete"),
    );
  }

  function priceKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    field: "minPrice" | "maxPrice",
  ) {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      !["Backspace", "Delete"].includes(event.key)
    )
      return;
    const input = event.currentTarget;
    if (input.selectionStart !== input.selectionEnd) return;
    const direction = event.key === "Backspace" ? -1 : 1;
    let position = (input.selectionStart ?? 0) + (direction === -1 ? -1 : 0);
    if (/\d/.test(input.value[position] ?? "")) return;
    event.preventDefault();
    while (
      position >= 0 &&
      position < input.value.length &&
      !/\d/.test(input.value[position])
    )
      position += direction;
    if (position < 0 || position >= input.value.length) return;
    const raw =
      input.value.slice(0, position) + input.value.slice(position + 1);
    updatePrice(input, raw, position, field, true);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex w-full min-w-0 flex-wrap gap-3 sm:w-auto sm:flex-1 sm:max-w-[400px]">
        <div className="min-w-[130px] flex-1">
          <label
            htmlFor="min-price"
            className="mb-1.5 block text-xs font-bold text-muted"
          >
            Preço mínimo
          </label>
          <input
            id="min-price"
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={values.minPrice}
            onChange={(event) => changePrice(event, "minPrice")}
            onKeyDown={(event) => priceKeyDown(event, "minPrice")}
            className={inputClass}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? "price-filter-error" : undefined}
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
            type="text"
            inputMode="numeric"
            placeholder="R$ 10.000,00"
            value={values.maxPrice}
            onChange={(event) => changePrice(event, "maxPrice")}
            onKeyDown={(event) => priceKeyDown(event, "maxPrice")}
            className={inputClass}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? "price-filter-error" : undefined}
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

      <div className="w-full sm:ml-auto sm:w-auto">
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
        <p
          id="price-filter-error"
          role="alert"
          className="w-full text-[13px] font-medium text-danger"
        >
          {priceError}
        </p>
      ) : null}
    </div>
  );
}
