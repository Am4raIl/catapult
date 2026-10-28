"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/features/auth/SessionProvider";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?from=%2Fadmin");
    }
  }, [router, status]);

  if (status !== "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ground p-6">
        <div className="flex w-full max-w-sm flex-col gap-3" aria-label="Carregando sessão">
          <div className="mx-auto mb-4 font-display text-2xl font-extrabold text-violet">
            Catapult
          </div>
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-line" />
          <div className="h-4 w-full animate-pulse rounded-full bg-line" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-line" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
