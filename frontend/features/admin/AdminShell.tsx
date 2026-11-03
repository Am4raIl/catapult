"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CatapultMark, LogOutIcon, MenuIcon } from "@/components/icons";
import { useSession } from "@/features/auth/SessionProvider";
import { authApi } from "@/lib/api/auth";

export function AdminShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { username, signOut } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [mobileMenu, setMobileMenu] = useState(false);
  async function logout() {
    try {
      await authApi.logout();
    } catch {}
    signOut();
    queryClient.clear();
    router.replace("/");
  }
  const navigation = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/categorias", label: "Categorias" },
    { href: "/", label: "Vitrine pública" },
  ];
  function links() {
    return navigation.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileMenu(false)}
        aria-current={pathname === href ? "page" : undefined}
        className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition ${pathname === href ? "bg-violet text-white" : "text-[#D9D6F5] hover:bg-white/10"}`}
      >
        {label}
      </Link>
    ));
  }
  return (
    <div className="min-h-screen bg-ground lg:flex">
      <aside className="on-dark sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col px-4 py-7 text-white lg:flex">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 font-display text-2xl font-extrabold"
        >
          <CatapultMark className="h-6 w-6 text-lime" />
          Catapult
        </Link>
        <nav
          className="mt-9 flex flex-col gap-1"
          aria-label="Navegação do painel"
        >
          {links()}
        </nav>
        <Button
          variant="ghost"
          onClick={logout}
          className="mt-auto w-full justify-start !text-[#D9D6F5] hover:!bg-white/10"
        >
          <LogOutIcon className="h-4 w-4" />
          Sair
        </Button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="on-dark flex items-center justify-between gap-3 px-4 py-3 text-white lg:hidden">
          <Link href="/" className="font-display text-xl font-extrabold">
            Catapult
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="!text-white hover:!bg-white/10"
            onClick={() => setMobileMenu((open) => !open)}
            aria-label="Abrir menu"
            aria-expanded={mobileMenu}
            aria-controls="admin-mobile-nav"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </header>
        {mobileMenu ? (
          <nav
            id="admin-mobile-nav"
            className="on-dark flex flex-col gap-1 px-4 pb-4 text-white lg:hidden"
            aria-label="Menu do painel"
          >
            {links()}
            <Button
              variant="ghost"
              onClick={logout}
              className="justify-start !text-[#D9D6F5]"
            >
              <LogOutIcon className="h-4 w-4" />
              Sair
            </Button>
          </nav>
        ) : null}
        <main className="w-full flex-1 p-5 sm:p-8 xl:p-10 2xl:p-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-[32px] font-extrabold leading-tight">
                {title}
              </h1>
              <p className="mt-1 text-[13px] text-muted">{description}</p>
              <div className="mt-3">
                <Tag variant="info">Sessão: {username}</Tag>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {action}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
