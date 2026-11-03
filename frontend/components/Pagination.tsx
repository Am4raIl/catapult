"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function Pagination({
  page,
  totalPages,
  totalElements,
  disabled = false,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages < 1) return null;
  const pages = Array.from(
    new Set([0, page - 1, page, page + 1, totalPages - 1]),
  )
    .filter((value) => value >= 0 && value < totalPages)
    .sort((a, b) => a - b);
  const buttonClass =
    "pagination-button inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-surface px-2 text-sm font-semibold transition hover:border-violet hover:text-violet disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav
      aria-label="Paginação de produtos"
      className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6"
    >
      <p className="text-xs text-muted" role="status">
        Página <span className="font-bold text-ink">{page + 1}</span> de{" "}
        {totalPages} · {totalElements} produtos
      </p>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className={buttonClass}
          aria-label="Página anterior"
          disabled={disabled || page === 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {pages.map((value, index) => (
          <span key={value} className="contents">
            {index > 0 && value - pages[index - 1] > 1 ? (
              <span className="px-1 text-muted" aria-hidden="true">
                …
              </span>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(value)}
              aria-label={`Ir para a página ${value + 1}`}
              aria-current={page === value ? "page" : undefined}
              className={`${buttonClass} ${page === value ? "pagination-current" : ""}`}
            >
              {value + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          className={buttonClass}
          aria-label="Próxima página"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
