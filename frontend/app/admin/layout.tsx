import { Suspense, type ReactNode } from "react";
import { AdminGuard } from "@/features/admin/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<main className="min-h-screen bg-ground" aria-hidden="true" />}
    >
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
