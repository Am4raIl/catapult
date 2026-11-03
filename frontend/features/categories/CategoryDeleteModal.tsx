"use client";

import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Modal, ModalHeader } from "@/components/Modal";
import { TrashIcon, ArrowUpRightIcon } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { categoriesApi } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { refreshCategoryData } from "./category-cache";

export function CategoryDeleteModal({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const titleId = useId();
  const [error, setError] = useState<string | null>(null);
  const client = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: ["category", category.id],
    queryFn: () => categoriesApi.get(category.id),
    initialData: category,
    staleTime: 0,
  });
  const current = query.data;
  const linked = current.products.length > 0;
  const missing = query.error instanceof ApiError && query.error.status === 404;

  async function removed(alreadyMissing = false) {
    client.setQueryData<Category[]>(["categories"], (items) =>
      items?.filter((item) => item.id !== category.id),
    );
    client.removeQueries({
      queryKey: ["category", category.id],
      exact: true,
      type: "inactive",
    });
    await refreshCategoryData(client);
    if (alreadyMissing)
      toast.info("Categoria já excluída", "O painel foi atualizado.");
    else toast.success("Categoria excluída", current.name);
    onClose();
  }

  const mutation = useMutation({
    mutationFn: () => categoriesApi.remove(category.id),
    onSuccess: () => removed(),
    onError: async (failure) => {
      if (failure instanceof ApiError && failure.status === 404) {
        await removed(true);
        return;
      }
      if (failure instanceof ApiError && failure.status === 409) {
        setError(
          "Não é possível excluir: esta categoria possui produtos vinculados. Transfira os produtos para outra categoria e tente novamente.",
        );
        await query.refetch();
        void refreshCategoryData(client);
      } else {
        setError(
          "Não foi possível excluir a categoria. Tente novamente em alguns instantes.",
        );
      }
    },
  });

  return (
    <Modal
      open
      labelledBy={titleId}
      onClose={onClose}
      closeDisabled={mutation.isPending}
      widthClass="max-w-[500px]"
    >
      <ModalHeader
        title="Excluir categoria?"
        titleId={titleId}
        subtitle="Revise antes de confirmar."
        onClose={onClose}
        closeDisabled={mutation.isPending}
        thumb={
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error text-error-ink">
            <TrashIcon className="h-6 w-6" />
          </span>
        }
      />
      <div className="mt-6 rounded-2xl border border-line bg-ground p-4">
        <p className="break-words font-display text-lg font-bold">
          {current.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {current.products.length}{" "}
          {current.products.length === 1
            ? "produto vinculado"
            : "produtos vinculados"}
        </p>
      </div>
      {missing ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-info p-4 text-sm text-info-ink"
        >
          Esta categoria já não existe. Feche esta janela para voltar ao painel.
        </p>
      ) : linked ? (
        <div className="mt-4 rounded-xl bg-warning p-4 text-sm text-warning-ink">
          <p>
            Esta categoria tem produtos vinculados. Transfira-os para outra
            categoria antes de excluí-la.
          </p>
          <Link
            href={`/admin?categoria=${encodeURIComponent(current.id)}#produtos`}
            className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold underline"
          >
            Gerenciar produtos <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Esta ação remove a categoria do catálogo e não pode ser desfeita.
        </p>
      )}
      {query.isError && !missing ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          Não foi possível conferir os produtos vinculados.{" "}
          <button
            type="button"
            onClick={() => query.refetch()}
            className="min-h-11 font-bold underline"
          >
            Tentar novamente
          </button>
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-error p-4 text-sm text-error-ink"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
        <Button
          variant="secondary"
          data-autofocus
          disabled={mutation.isPending}
          onClick={() => {
            if (missing) void removed(true);
            else onClose();
          }}
        >
          {missing ? "Fechar" : "Cancelar"}
        </Button>
        {!missing ? (
          <Button
            variant="danger"
            loading={mutation.isPending}
            disabled={linked || query.isFetching || query.isError}
            onClick={() => {
              if (!mutation.isPending) {
                setError(null);
                mutation.mutate();
              }
            }}
          >
            <TrashIcon className="h-4 w-4" />
            Excluir categoria
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
