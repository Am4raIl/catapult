import { Suspense } from "react";
import { LoginScreen } from "@/features/auth/LoginScreen";

function safeFrom(value: string | string[] | undefined): string {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const params = await searchParams;
  const from = safeFrom(params.from);

  return <LoginScreen from={from} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-ground" aria-hidden="true" />}
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
