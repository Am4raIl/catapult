"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { TrashIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { Thumb } from "@/components/Thumb";
import { useToast } from "@/components/Toaster";
import { ApiError } from "@/lib/api/client";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

export function ProductDeleteModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const titleId = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);

    try {
      await productsApi.remove(product.id);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["product", product.id] });
      toast.info(
        "Produto excluído",
        "O arquivo associado também foi removido.",
      );
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.removeQueries({ queryKey: ["product", product.id] });
        toast.info(
          "Produto excluído",
          "Ele já não estava mais disponível.",
        );
        onClose();
        return;
      }

      if (error instanceof ApiError && error.status >= 500) {
        toast.error(
          "Não foi possível excluir",
          "O arquivo associado pode não ter sido removido.",
        );
      } else {
        toast.error(
          "Não foi possível excluir",
          "Tente novamente em alguns instantes.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      widthClass="max-w-[440px]"
      closeDisabled={loading}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-error text-danger"
          aria-hidden="true"
        >
          <TrashIcon className="h-8 w-8" />
        </span>
        <h2
          id={titleId}
          className="mt-5 font-display text-2xl font-extrabold text-ink"
        >
          Excluir produto?
        </h2>
        <p className="mt-2 max-w-sm text-[13px] text-muted">
          Esta ação remove o produto e o arquivo associado. Não é possível
          desfazer.
        </p>

        <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-ground p-3 text-left">
          <Thumb
            id={product.id}
            photo={product.photo}
            alt={product.name}
            className="h-11 w-11"
            roundedClass="rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">
              {product.name}
            </p>
            <p className="truncate text-[13px] text-muted">
              {product.category.name} · {formatCurrency(product.price)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            data-autofocus
          >
            Cancelar
          </Button>
          <Button variant="danger" loading={loading} onClick={handleDelete}>
            Sim, excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
