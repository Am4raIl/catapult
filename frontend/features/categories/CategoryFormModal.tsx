"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { InputField } from "@/components/FormField";
import { Modal, ModalHeader } from "@/components/Modal";
import { PackageIcon, PlusIcon, CheckIcon } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { ApiError } from "@/lib/api/client";
import { categoriesApi } from "@/lib/api/categories";
import type { Category } from "@/lib/api/types";
import { refreshCategoryData } from "./category-cache";

export function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
}) {
  const titleId = useId();
  const [name, setName] = useState(category?.name ?? "");
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const inFlight = useRef(false);
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (value: string) =>
      category
        ? categoriesApi.update(category.id, { name: value })
        : categoriesApi.create({ name: value }),
    onSuccess: async (saved) => {
      client.setQueryData(["category", saved.id], saved);
      client.setQueryData<Category[]>(["categories"], (current) =>
        current
          ? current.some((item) => item.id === saved.id)
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [...current, saved]
          : [saved],
      );
      await refreshCategoryData(client);
      toast.success(
        category ? "Categoria atualizada" : "Categoria criada",
        saved.name,
      );
      onSaved(saved);
      onClose();
    },
    onError: (failure) => {
      if (failure instanceof ApiError && failure.status === 400) {
        setNameError("Confira o nome da categoria e tente novamente.");
      } else if (failure instanceof ApiError && failure.status === 404) {
        setMissing(true);
        setError(
          "Esta categoria não existe mais. Feche esta janela para voltar ao painel atualizado.",
        );
        void refreshCategoryData(client);
      } else {
        setError(
          "Não foi possível salvar a categoria. Seus dados foram mantidos; tente novamente.",
        );
      }
    },
    onSettled: () => {
      inFlight.current = false;
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || mutation.isPending || missing) return;
    const value = name.trim();
    if (!value || value.length > 255) {
      setNameError(
        !value
          ? "Informe o nome da categoria."
          : "Use no máximo 255 caracteres.",
      );
      return;
    }
    setNameError(undefined);
    setError(null);
    inFlight.current = true;
    mutation.mutate(value);
  }

  return (
    <Modal
      open
      labelledBy={titleId}
      onClose={onClose}
      closeDisabled={mutation.isPending}
      widthClass="max-w-[520px]"
    >
      <form onSubmit={submit} noValidate>
        <ModalHeader
          title={category ? "Editar categoria" : "Nova categoria"}
          titleId={titleId}
          subtitle={
            category
              ? "Atualize o nome e mantenha seu catálogo organizado."
              : "Um novo espaço para organizar seus produtos."
          }
          thumb={
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info text-info-ink">
              <PackageIcon className="h-6 w-6" />
            </span>
          }
          onClose={onClose}
          closeDisabled={mutation.isPending}
        />
        <div className="mt-7">
          <InputField
            id="category-name"
            name="name"
            label="Nome da categoria"
            placeholder="Ex.: Acessórios"
            value={name}
            maxLength={255}
            required
            data-autofocus
            disabled={mutation.isPending || missing}
            error={nameError}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
              setError(null);
            }}
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {category
              ? "Os produtos vinculados continuam nesta categoria após a alteração."
              : "Depois de criar, você poderá vincular produtos a esta categoria."}
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-error p-3.5 text-sm text-error-ink"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-line pt-5">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending} disabled={missing}>
            {category ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            {category ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
