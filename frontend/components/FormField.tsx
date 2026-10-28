"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

const fieldBase =
  "h-11 w-full rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 transition";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-bold text-muted">
      {children}
    </label>
  );
}

function FieldMessage({
  id,
  error,
}: {
  id: string;
  error?: string;
}) {
  if (!error) return null;
  return (
    <p id={id} className="text-[13px] font-medium text-danger">
      {error}
    </p>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function InputField({
  label,
  error,
  id,
  className = "",
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldBase} ${
          error ? "border-danger" : ""
        } ${props.readOnly ? "border-line-soft bg-ground focus:outline-none" : ""} ${className}`}
        {...props}
      />
      <FieldMessage id={errorId} error={error} />
    </div>
  );
}

interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  id,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldBase} ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={errorId} error={error} />
    </div>
  );
}

interface ReadonlyFieldProps {
  label: string;
  value: string;
  fullWidth?: boolean;
}

export function ReadonlyField({
  label,
  value,
  fullWidth = false,
}: ReadonlyFieldProps) {
  const id = useId();

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        readOnly
        value={value}
        className={`${fieldBase} border-line-soft bg-ground text-ink focus:outline-none`}
        tabIndex={-1}
      />
    </div>
  );
}
