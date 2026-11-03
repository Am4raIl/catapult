"use client";

import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Modal, ModalHeader } from "@/components/Modal";
import { Tag } from "@/components/Tag";
import { ArrowUpRightIcon, PackageIcon, PencilIcon } from "@/components/icons";
import { categoriesApi } from "@/lib/api/categories";
import { dashboardApi } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

export function CategoryViewModal({
  category,
  onClose,
  onEdit,
}: {
  category: Category;
  onClose: () => void;
  onEdit: (category: Category) => void;
}) {
  const titleId = useId();
  const query = useQuery({
    queryKey: ["category", category.id],
    queryFn: () => categoriesApi.get(category.id),
    initialData: category,
    staleTime: 0,
  });
  const metrics = useQuery({
    queryKey: ["dashboard", "products-by-category"],
    queryFn: dashboardApi.productsByCategory,
  });
  const current = query.data;
  const missing = query.error instanceof ApiError && query.error.status === 404;
  const inventory =
    metrics.data?.find((row) => row.category_id === current.id)?.total_value ??
    0;
  const average = current.products.length
    ? current.products.reduce((sum, item) => sum + item.price, 0) /
      current.products.length
    : null;
  return (
    <Modal
      open
      labelledBy={titleId}
      onClose={onClose}
      widthClass="max-w-[760px]"
    >
      <ModalHeader
        title={missing ? "Categoria não encontrada" : current.name}
        subtitle="Detalhes da categoria"
        titleId={titleId}
        onClose={onClose}
        thumb={
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info text-info-ink">
            <PackageIcon className="h-6 w-6" />
          </span>
        }
      />
      {query.isError ? (
        <div
          className="mt-6 rounded-xl bg-error p-4 text-sm text-error-ink"
          role="alert"
        >
          {missing
            ? "Esta categoria pode ter sido excluída por outro administrador."
            : "Não foi possível atualizar os dados. As informações exibidas são da última consulta."}
          {!missing ? (
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => query.refetch()}
            >
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : null}
      {!missing ? (
        <>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Produtos cadastrados", String(current.products.length)],
              [
                "Valor em estoque",
                metrics.isPending || metrics.isError
                  ? "—"
                  : formatCurrency(inventory),
              ],
              ["Preço médio", formatCurrency(average)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-2xl border border-line bg-ground p-4"
              >
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-2 break-words font-display text-xl font-bold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <dl className="mt-5 rounded-2xl border border-line px-4 py-3">
            <dt className="text-xs text-muted">Identificador da categoria</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {current.id}
            </dd>
          </dl>
          <div className="mb-3 mt-6 flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold">
              Produtos vinculados
            </h3>
            <Tag variant="info">{current.products.length}</Tag>
          </div>
          {current.products.length ? (
            <ul
              className="max-h-64 divide-y divide-line overflow-y-auto overscroll-contain rounded-2xl border border-line"
              aria-label="Produtos desta categoria"
            >
              {current.products.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <span className="min-w-0 break-words text-sm font-semibold">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {formatCurrency(product.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-line-input bg-ground px-5 py-7 text-center text-sm text-muted">
              Esta categoria ainda não tem produtos vinculados.
            </div>
          )}
        </>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        {!missing ? (
          <Link
            href={`/admin?categoria=${encodeURIComponent(current.id)}#produtos`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-violet hover:underline"
          >
            Gerenciar produtos <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        ) : null}
        <div className="ml-auto flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {!missing ? (
            <Button onClick={() => onEdit(current)}>
              <PencilIcon className="h-4 w-4" />
              Editar categoria
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
