"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { PlusIcon } from "@/components/icons";
import { ProductDeleteModal } from "@/features/products/ProductDeleteModal";
import { ProductFormModal } from "@/features/products/ProductFormModal";
import { ProductViewModal } from "@/features/products/ProductViewModal";
import type { Product } from "@/lib/api/types";
import { Insights } from "./Insights";
import { AdminShell } from "./AdminShell";
import { KpiRow } from "./KpiRow";
import { ProductsTable, type AdminTableFilters } from "./ProductsTable";

type ModalState =
  | { type: "view"; product: Product }
  | { type: "edit"; product: Product }
  | { type: "create" }
  | { type: "delete"; product: Product }
  | null;

const initialTableFilters: AdminTableFilters = {
  status: "ALL",
  search: "",
  categoryId: "",
  page: 0,
};

export function AdminPage() {
  const searchParams = useSearchParams();
  const [modal, setModal] = useState<ModalState>(null);
  const [filters, setFilters] = useState<AdminTableFilters>({
    ...initialTableFilters,
    categoryId: searchParams.get("categoria") ?? "",
  });

  function handleLowStock() {
    setFilters((current) => ({
      ...current,
      status: "LOW_STOCK",
      page: 0,
    }));
    document
      .getElementById("produtos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AdminShell
      title="Painel"
      description="Indicadores e produtos em um só lugar"
      action={
        <Button onClick={() => setModal({ type: "create" })}>
          <PlusIcon className="h-4 w-4" />
          Novo produto
        </Button>
      }
    >
      <div className="mt-6">
        <KpiRow />
      </div>

      <Insights onLowStock={handleLowStock} />

      <ProductsTable
        filters={filters}
        onChange={setFilters}
        onView={(product) => setModal({ type: "view", product })}
        onEdit={(product) => setModal({ type: "edit", product })}
        onDelete={(product) => setModal({ type: "delete", product })}
      />

      {modal?.type === "view" ? (
        <ProductViewModal
          product={modal.product}
          mode="admin"
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", product: modal.product })}
        />
      ) : null}

      {modal?.type === "edit" ? (
        <ProductFormModal
          product={modal.product}
          onClose={() => setModal(null)}
        />
      ) : null}

      {modal?.type === "create" ? (
        <ProductFormModal onClose={() => setModal(null)} />
      ) : null}

      {modal?.type === "delete" ? (
        <ProductDeleteModal
          product={modal.product}
          onClose={() => setModal(null)}
        />
      ) : null}
    </AdminShell>
  );
}
