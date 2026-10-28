import type { ReactNode } from "react";
import type { TagVariant } from "@/lib/product-status";

const styles: Record<TagVariant, string> = {
  success: "bg-success text-success-ink",
  warning: "bg-warning text-warning-ink",
  error: "bg-error text-error-ink",
  info: "bg-info text-info-ink",
  neutral: "border border-line bg-ground text-muted",
};

export function Tag({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
