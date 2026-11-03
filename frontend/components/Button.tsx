"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant =
  "primary" | "secondary" | "danger" | "lime" | "darkSecondary" | "ghost";

export type ButtonSize = "md" | "sm" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-violet text-white hover:brightness-90",
  secondary: "border border-line-input bg-surface text-ink hover:bg-ground",
  danger: "bg-[#b3122f] text-white hover:brightness-90",
  lime: "bg-lime text-[#172210] hover:brightness-95",
  darkSecondary:
    "border border-[#8F86E0] bg-transparent text-white hover:bg-white/10",
  ghost: "bg-transparent text-ink hover:bg-line-soft",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "min-h-11 px-5",
  sm: "min-h-11 px-3 text-[13px]",
  icon: "h-11 w-11 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  },
);
