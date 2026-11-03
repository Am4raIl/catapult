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
      data-variant={variant}
      className={`status-tag inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-current/10 px-2.5 py-1.5 text-[11px] font-semibold leading-none ${styles[variant]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
      />
      {children}
    </span>
  );
}
