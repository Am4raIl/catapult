"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toaster";
import { ApiError } from "@/lib/api/client";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/api/types";

export function ProductsBulkDeleteModal({ products, onClose, onDeleted }: {
  products: Product[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const titleId = useId();
  const client = useQueryClient();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await productsApi.removeMany(products.map((product) => product.id));
      for (const product of products) client.removeQueries({ queryKey: ["product", product.id] });
      for (const key of ["products", "dashboard", "categories", "category"]) {
        void client.invalidateQueries({ queryKey: [key] });
      }
      toast.info("Produtos excluídos", `${products.length} produto(s) removido(s).`);
      onDeleted();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        void client.invalidateQueries({ queryKey: ["products"] });
        toast.error("Seleção desatualizada", "Um dos produtos já foi removido. Nenhum outro item foi excluído. Atualize a seleção.");
        onClose();
      } else {
        setError("Não foi possível concluir a exclusão. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return <Modal open onClose={onClose} labelledBy={titleId} closeDisabled={loading} widthClass="max-w-[480px]">
    <h2 id={titleId} className="font-display text-2xl font-extrabold text-ink">Excluir {products.length} produto(s)?</h2>
    <p className="mt-2 text-sm text-muted">Os produtos selecionados e seus arquivos serão removidos permanentemente. Não é possível desfazer.</p>
    <ul className="mt-4 max-h-48 list-inside list-disc overflow-y-auto rounded-xl bg-ground p-4 text-sm text-ink">
      {products.map((product) => <li key={product.id}>{product.name}</li>)}
    </ul>
    {error ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p> : null}
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={loading} data-autofocus>Cancelar</Button>
      <Button variant="danger" loading={loading} onClick={handleDelete}>Excluir selecionados</Button>
    </div>
  </Modal>;
}
