"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { PackageIcon } from "@/components/icons";

export default function NotFound() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = search.trim();
    router.push(term ? `/?nome=${encodeURIComponent(term)}` : "/");
  }

  return (
    <main className="on-dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 py-12 text-center text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[480px] w-[480px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(91,61,245,0.72), transparent 68%)",
        }}
        aria-hidden="true"
      />

      <Link
        href="/"
        className="relative font-display text-2xl font-extrabold text-lime"
      >
        Catapult
      </Link>

      <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
        <span className="font-display text-[120px] font-extrabold leading-none sm:text-[200px]">
          4
        </span>
        <span
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-lime text-ink sm:h-[180px] sm:w-[180px]"
          role="img"
          aria-label="Caixa vazia"
        >
          <PackageIcon className="h-14 w-14 sm:h-20 sm:w-20" strokeWidth={1.6} />
        </span>
        <span className="font-display text-[120px] font-extrabold leading-none sm:text-[200px]">
          4
        </span>
      </div>

      <h1 className="relative mt-2 font-display text-[32px] font-extrabold leading-tight sm:text-[40px]">
        Esse produto saiu do estoque.
      </h1>
      <p className="relative mt-3 max-w-lg text-[15px] text-white/75">
        A página ou o produto que você procura não existe mais, ou o link está
        incorreto.
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative mt-8 flex w-full max-w-[320px] gap-2"
      >
        <label htmlFor="not-found-search" className="sr-only">
          Buscar produtos
        </label>
        <input
          id="not-found-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar na vitrine"
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#8F86E0] bg-transparent px-3.5 text-sm text-white placeholder:text-white/50"
        />
        <Button type="submit" variant="lime">
          Buscar
        </Button>
      </form>

      <div className="relative mt-4 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex">
          <Button variant="darkSecondary">Voltar à vitrine</Button>
        </Link>
        <Link href="/#categorias" className="inline-flex">
          <Button variant="darkSecondary">Ver categorias</Button>
        </Link>
      </div>
    </main>
  );
}
