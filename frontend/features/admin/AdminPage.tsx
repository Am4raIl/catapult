"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import {
  LogOutIcon,
  MenuIcon,
  PlusIcon,
} from "@/components/icons";
import { Tag } from "@/components/Tag";
import { useSession } from "@/features/auth/SessionProvider";
import { ProductDeleteModal } from "@/features/products/ProductDeleteModal";
import { ProductFormModal } from "@/features/products/ProductFormModal";
import { ProductViewModal } from "@/features/products/ProductViewModal";
import { authApi } from "@/lib/api/auth";
import type { Product } from "@/lib/api/types";
import { Insights } from "./Insights";
import { KpiRow } from "./KpiRow";
import {
  ProductsTable,
  type AdminTableFilters,
} from "./ProductsTable";

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

function NavItem({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold ${
        active ? "bg-violet text-white" : "text-[#D9D6F5]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </div>
  );
}

export function AdminPage() {
  const { username, signOut } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>(null);
  const [filters, setFilters] = useState<AdminTableFilters>(
    initialTableFilters,
  );
  const [mobileMenu, setMobileMenu] = useState(false);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // O logout é idempotente no backend; seguimos limpando a sessão local.
    }
    signOut();
    queryClient.clear();
    router.replace("/");
  }

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
    <div className="min-h-screen bg-ground lg:flex">
      <aside className="on-dark sticky top-0 hidden h-screen w-[210px] shrink-0 flex-col bg-ink px-3.5 py-[22px] text-white lg:flex">
        <Link href="/" className="px-2 font-display text-2xl font-extrabold">
          Catapult
        </Link>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Navegação do painel">
          <NavItem active>Painel</NavItem>
          <div
            className="flex min-h-11 cursor-not-allowed items-center rounded-xl px-3 text-sm font-bold text-white/40"
            aria-disabled="true"
            title="Em breve"
          >
            Categorias
          </div>
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#D9D6F5] transition hover:bg-white/10"
          >
            Vitrine pública
          </Link>
        </nav>

        <div className="mt-auto">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-[#D9D6F5] hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="on-dark flex items-center gap-3 bg-ink px-4 py-3 text-white lg:hidden">
          <Link href="/" className="font-display text-xl font-extrabold">
            Catapult
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white hover:bg-white/10"
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Abrir menu"
            aria-expanded={mobileMenu}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </header>

        {mobileMenu ? (
          <nav
            className="on-dark flex flex-col gap-1 border-b border-white/10 bg-ink px-4 pb-4 text-white lg:hidden"
            aria-label="Menu do painel"
          >
            <NavItem active>Painel</NavItem>
            <Link
              href="/"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#D9D6F5]"
            >
              Vitrine pública
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm font-bold text-[#D9D6F5]"
            >
              <LogOutIcon className="h-4 w-4" />
              Sair
            </button>
          </nav>
        ) : null}

        <main className="mx-auto w-full max-w-[1280px] flex-1 p-5 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="font-display text-[32px] font-extrabold leading-tight text-ink">
                Painel
              </h1>
              <p className="mt-1 text-[13px] text-muted">
                Indicadores e produtos em um só lugar
              </p>
              <div className="mt-3">
                <Tag variant="success">Sessão: {username}</Tag>
              </div>
            </div>
            <Button onClick={() => setModal({ type: "create" })}>
              <PlusIcon className="h-4 w-4" />
              Novo produto
            </Button>
          </div>

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
        </main>
      </div>

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
    </div>
  );
}
