"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { Button } from "@/components/Button";
import { ReadonlyField } from "@/components/FormField";
import { Modal, ModalHeader } from "@/components/Modal";
import { Tag } from "@/components/Tag";
import { Thumb } from "@/components/Thumb";
import { BagIcon, PackageIcon } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { ApiError } from "@/lib/api/client";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";
import { formatCurrency, formatDateTime, formatStock } from "@/lib/format";
import { getAdminStatus, getStorefrontStatus } from "@/lib/product-status";

export function ProductViewModal({
  product,
  mode,
  onClose,
  onEdit,
  onBuy,
}: {
  product: Product;
  mode: "public" | "admin";
  onClose: () => void;
  onEdit?: () => void;
  onBuy?: (product: Product) => void;
}) {
  const titleId = useId();
  const toast = useToast();

  const { data: current, error } = useQuery({
    queryKey: ["product", product.id],
    queryFn: () => productsApi.get(product.id),
    initialData: product,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 404) {
      toast.error("Produto não encontrado", "Ele pode ter sido excluído.");
      onClose();
    }
  }, [error, onClose, toast]);

  const status = getAdminStatus(current.stock_quantity);
  const isAdmin = mode === "admin";

  if (!isAdmin) {
    const publicStatus = getStorefrontStatus(current.stock_quantity);
    const available = current.active && current.stock_quantity > 0;
    return (
      <Modal
        open
        onClose={onClose}
        labelledBy={titleId}
        widthClass="max-w-[960px]"
      >
        <ModalHeader
          title="Um olhar mais de perto."
          titleId={titleId}
          subtitle="Detalhes do produto"
          onClose={onClose}
        />
        <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-9">
          <div className="relative aspect-square overflow-hidden rounded-[22px]">
            <Thumb
              id={current.id}
              photo={current.photo}
              alt={current.name}
              className="h-full w-full"
              roundedClass="rounded-[22px]"
              openPdf
            />
            <span className="pointer-events-none absolute left-4 top-4">
              <Tag variant={publicStatus.variant}>{publicStatus.label}</Tag>
            </span>
          </div>
          <div className="flex min-w-0 flex-col justify-center py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-violet">
              {current.category.name}
            </p>
            <h3 className="mt-3 break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {current.name}
            </h3>
            <p className="mt-6 font-display text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrency(current.price)}
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <PackageIcon className="h-4 w-4" />
              {available
                ? `${formatStock(current.stock_quantity)} disponíveis`
                : "Produto indisponível no momento"}
            </p>
            <div className="mt-8 border-t border-line pt-6">
              {onBuy ? (
                <Button
                  className="w-full"
                  disabled={!available}
                  onClick={() => {
                    onBuy(current);
                    onClose();
                  }}
                >
                  <BagIcon className="h-4 w-4" />
                  {available ? "Adicionar à sacola" : "Indisponível"}
                </Button>
              ) : null}
              <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
                Continuar explorando
              </Button>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Adicione à sacola e finalize sua compra por lá. Sem cobrança online.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title={current.name}
        titleId={titleId}
        subtitle="Somente visualização"
        thumb={
          <Thumb
            id={current.id}
            photo={current.photo}
            alt={current.name}
            className="h-14 w-14"
            roundedClass="rounded-2xl"
          />
        }
        onClose={onClose}
      />

      <div className="relative mt-5 aspect-[16/7] w-full overflow-hidden rounded-[20px]">
        <Thumb
          id={current.id}
          photo={current.photo}
          alt={current.name}
          className="h-full w-full"
          roundedClass="rounded-[20px]"
          openPdf
        />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <Tag variant={status.variant}>{status.label}</Tag>
          <Tag variant={current.active ? "success" : "neutral"}>
            {current.active ? "Ativo" : "Inativo"}
          </Tag>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ReadonlyField label="Nome" value={current.name} fullWidth />
        <ReadonlyField label="Categoria" value={current.category.name} />
        <ReadonlyField
          label="Estoque"
          value={formatStock(current.stock_quantity)}
        />
        <ReadonlyField label="Preço" value={formatCurrency(current.price)} />
        {isAdmin ? (
          <ReadonlyField
            label="Custo"
            value={formatCurrency(current.cost_price)}
          />
        ) : null}
        {isAdmin ? (
          <ReadonlyField
            label="Criado em"
            value={formatDateTime(current.created_at)}
          />
        ) : null}
        {isAdmin ? (
          <ReadonlyField
            label="Atualizado em"
            value={formatDateTime(current.updated_at)}
          />
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
        {isAdmin && onEdit ? (
          <Button variant="primary" onClick={onEdit}>
            Editar
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
