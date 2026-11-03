"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/Button";
import { InputField, SelectField } from "@/components/FormField";
import { ImageIcon } from "@/components/icons";
import { Modal, ModalHeader } from "@/components/Modal";
import { Thumb } from "@/components/Thumb";
import { useToast } from "@/components/Toaster";
import { ApiError } from "@/lib/api/client";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import type { Product, ProductInput } from "@/lib/api/types";
import { formatPriceInput, parseDecimalInput } from "@/lib/format";
import {
  blobToFile,
  productFormSchema,
  validateProductFile,
  type ProductFormValues,
} from "./schema";

type ServerField =
  "name" | "price" | "categoryId" | "stockQuantity" | "costPrice";

const serverFieldMap: Record<string, ServerField> = {
  name: "name",
  price: "price",
  category_id: "categoryId",
  stock_quantity: "stockQuantity",
  cost_price: "costPrice",
};

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product?: Product;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const titleId = useId();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = Boolean(product);
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewObjectUrl = useRef<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      categoryId: product?.category.id ?? "",
      stockQuantity: String(product?.stock_quantity ?? 0),
      price: product ? formatPriceInput(product.price) : "",
      costPrice:
        product?.cost_price != null ? formatPriceInput(product.cost_price) : "",
      active: product?.active ?? true,
    },
  });

  useEffect(() => {
    return () => {
      if (previewObjectUrl.current) {
        URL.revokeObjectURL(previewObjectUrl.current);
      }
    };
  }, []);

  function updatePreview(nextFile: File | null) {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }

    if (nextFile && nextFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(nextFile);
      previewObjectUrl.current = url;
      setPreviewUrl(url);
      return;
    }

    setPreviewUrl(null);
  }

  function selectFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const validation = validateProductFile(nextFile);

    if (validation) {
      setFileError(validation);
      setFile(null);
      updatePreview(null);
      return;
    }

    setFileError(null);
    setRemovePhoto(false);
    setFile(nextFile);
    updatePreview(nextFile);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function toggleRemovePhoto() {
    setRemovePhoto((current) => !current);
    setFile(null);
    setFileError(null);
    updatePreview(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function applyServerErrors(payload: unknown): boolean {
    if (!payload || typeof payload !== "object") return false;

    const errors = (payload as { errors?: unknown }).errors;
    if (!Array.isArray(errors)) return false;

    let applied = false;

    errors.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const field = (item as { field?: string }).field;
      const message =
        (item as { defaultMessage?: string }).defaultMessage ??
        (item as { message?: string }).message;

      if (!field || !message) return;

      const mapped = serverFieldMap[field];
      if (mapped) {
        setError(mapped, { type: "server", message });
        applied = true;
      }
    });

    return applied;
  }

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    setFileError(null);

    if (fileError) return;

    const name = values.name.trim();
    const price = parseDecimalInput(values.price);
    const stock = Number(values.stockQuantity);
    const cost = values.costPrice.trim()
      ? parseDecimalInput(values.costPrice)
      : null;

    if (Number.isNaN(price) || price < 0.01) {
      setError("price", {
        type: "validate",
        message: "Informe um preço maior ou igual a R$ 0,01.",
      });
      return;
    }

    let photoFile = file;

    if (!photoFile && isEdit && product?.photo && !removePhoto) {
      try {
        const blob = await productsApi.downloadPhoto(product.photo);
        photoFile = blobToFile(blob);
      } catch {
        setFileError(
          "Não foi possível preservar a foto atual. Tente novamente ou remova a foto explicitamente.",
        );
        return;
      }
    }

    const input: ProductInput = {
      name,
      price,
      category_id: values.categoryId,
      stock_quantity: stock,
      active: values.active,
    };

    if (cost != null) {
      input.cost_price = cost;
    }

    function buildFormData(photo: File) {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", String(price));
      formData.append("category_id", values.categoryId);
      formData.append("stock_quantity", String(stock));
      formData.append("active", String(values.active));
      if (cost != null) formData.append("cost_price", String(cost));
      formData.append("photo", photo);
      return formData;
    }

    try {
      let saved: Product;
      if (isEdit && product) {
        if (photoFile) {
          saved = await productsApi.updateMultipart(
            product.id,
            buildFormData(photoFile),
          );
        } else {
          saved = await productsApi.updateJson(product.id, input);
        }
      } else if (photoFile) {
        saved = await productsApi.createMultipart(buildFormData(photoFile));
      } else {
        saved = await productsApi.createJson(input);
      }

      queryClient.setQueryData(["product", saved.id], saved);
      queryClient.setQueriesData(
        { queryKey: ["products"] },
        (data: unknown) => {
          if (!data || typeof data !== "object") return data;
          if ("content" in data && Array.isArray(data.content)) {
            return {
              ...data,
              content: data.content.map((item: Product) =>
                item.id === saved.id ? saved : item,
              ),
            };
          }
          return "id" in data && data.id === saved.id ? saved : data;
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
      ]);
      toast.success(
        "Produto salvo",
        `${name} foi ${isEdit ? "atualizado" : "criado"}.`,
      );
      onSaved?.();
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          const mapped = applyServerErrors(error.payload);
          if (!mapped) {
            setFormError("Não foi possível salvar. Verifique os dados.");
          }
          return;
        }
        if (error.status === 404) {
          queryClient.invalidateQueries({ queryKey: ["categories"] });
          toast.error(
            "Categoria não encontrada",
            "A lista de categorias será atualizada.",
          );
          return;
        }
        if (error.status === 413) {
          setFileError("O arquivo enviado é muito grande.");
          return;
        }
        if (error.status >= 500) {
          toast.error(
            "Não foi possível salvar",
            "Tente novamente em alguns instantes.",
          );
          return;
        }
      }

      setFormError("Não foi possível salvar. Tente novamente.");
    }
  }

  const currentPhoto = product?.photo ?? null;
  const showCurrentPhoto = Boolean(currentPhoto && !removePhoto);

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      closeDisabled={isSubmitting}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ModalHeader
          title={isEdit ? "Editar produto" : "Novo produto"}
          titleId={titleId}
          subtitle={
            isEdit
              ? "Atualize os dados e salve"
              : "Preencha os dados do novo produto"
          }
          thumb={
            <Thumb
              id={product?.id ?? "novo-produto"}
              photo={showCurrentPhoto ? currentPhoto : null}
              alt={product?.name ?? "Novo produto"}
              className="h-14 w-14"
              roundedClass="rounded-2xl"
            />
          }
          onClose={onClose}
          closeDisabled={isSubmitting}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {formError ? (
            <p
              role="alert"
              className="rounded-xl bg-error px-3.5 py-3 text-[13px] font-bold text-error-ink sm:col-span-2"
            >
              {formError}
            </p>
          ) : null}

          <div className="sm:col-span-2">
            <InputField
              label="Nome"
              placeholder="Nome do produto"
              error={errors.name?.message}
              data-autofocus
              {...register("name")}
            />
          </div>

          <SelectField
            label="Categoria"
            error={errors.categoryId?.message}
            disabled={categoriesQuery.isPending}
            {...register("categoryId")}
          >
            <option value="">Selecione uma categoria</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          <InputField
            label="Estoque"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            error={errors.stockQuantity?.message}
            {...register("stockQuantity")}
          />

          <InputField
            label="Preço"
            inputMode="decimal"
            placeholder="199,90"
            error={errors.price?.message}
            {...register("price")}
          />

          <InputField
            label="Custo (opcional)"
            inputMode="decimal"
            placeholder="120,00"
            error={errors.costPrice?.message}
            {...register("costPrice")}
          />

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--violet)]"
              {...register("active")}
            />
            <span className="text-sm font-bold text-ink">Produto ativo</span>
          </label>

          <div className="sm:col-span-2">
            <p className="mb-1.5 text-xs font-bold text-muted">Foto ou PDF</p>
            <div
              className={`rounded-[18px] border-2 border-dashed p-4 transition ${
                dragActive
                  ? "border-violet bg-info"
                  : fileError
                    ? "border-danger bg-ground"
                    : "border-line-input bg-ground"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Prévia do arquivo selecionado"
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : file?.type === "application/pdf" ? (
                  <div className="thumb-0 flex h-16 w-16 items-center justify-center rounded-2xl">
                    <span className="rounded-full bg-[#17153b]/85 px-2.5 py-1 text-xs font-bold text-white">
                      PDF
                    </span>
                  </div>
                ) : (
                  <Thumb
                    id={product?.id ?? "novo-produto"}
                    photo={showCurrentPhoto ? currentPhoto : null}
                    alt={product?.name ?? "Foto do produto"}
                    className="h-16 w-16"
                    roundedClass="rounded-2xl"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {file
                      ? file.name
                      : removePhoto
                        ? "A foto atual será removida"
                        : currentPhoto
                          ? "Foto atual"
                          : "Nenhum arquivo selecionado"}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    PNG, JPG, GIF, WEBP ou PDF · até 5 MB
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInput.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" />
                      Trocar arquivo
                    </Button>
                    {isEdit && currentPhoto ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleRemovePhoto}
                      >
                        {removePhoto ? "Manter foto atual" : "Remover foto"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,image/png,image/jpeg,image/gif,image/webp,application/pdf"
                className="sr-only"
                onChange={(event) => selectFile(event.target.files?.[0])}
                aria-label="Selecionar arquivo do produto"
              />
            </div>
            {fileError ? (
              <p
                id="product-file-error"
                role="alert"
                className="mt-1.5 text-[13px] font-medium text-danger"
              >
                {fileError}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl bg-warning px-3.5 py-3 text-[13px] font-medium text-warning-ink sm:col-span-2">
            Sem reenviar o arquivo, a foto atual é removida ao salvar.
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Salvar alterações" : "Criar produto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
