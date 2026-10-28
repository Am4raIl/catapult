import { Suspense } from "react";
import { StorefrontPage } from "@/features/storefront/StorefrontPage";

async function StorefrontContent({
  searchParams,
}: {
  searchParams: Promise<{ nome?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialName = typeof params.nome === "string" ? params.nome : "";

  return (
    <StorefrontPage key={initialName} initialName={initialName} />
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ nome?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ground" />}>
      <StorefrontContent searchParams={searchParams} />
    </Suspense>
  );
}
