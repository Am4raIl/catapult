"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({
  active = false,
  className = "",
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-[13px] font-bold transition ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line-input bg-surface text-ink hover:bg-ground"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
