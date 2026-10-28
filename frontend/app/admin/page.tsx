import { Suspense } from "react";
import { AdminPage } from "@/features/admin/AdminPage";

export default function AdminRoute() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ground" />}>
      <AdminPage />
    </Suspense>
  );
}
