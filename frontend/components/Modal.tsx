"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./Button";
import { CloseIcon } from "./icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  ariaLabel?: string;
  widthClass?: string;
  closeDisabled?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  ariaLabel,
  widthClass = "max-w-[620px]",
  closeDisabled = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    const timer = window.setTimeout(() => {
      const target =
        dialog.querySelector<HTMLElement>("[data-autofocus]") ??
        dialog.querySelector<HTMLElement>(
          "button, input, select, textarea, a[href]",
        );
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      previouslyFocused.current?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      className="m-auto max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] overflow-visible bg-transparent p-0 outline-none"
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !closeDisabled) onClose();
      }}
    >
      <div
        className={`modal-panel mx-auto max-h-[calc(100vh-32px)] w-full overflow-y-auto rounded-[28px] bg-surface p-5 shadow-[0_30px_80px_rgba(0,0,0,.45)] sm:p-7 ${widthClass}`}
      >
        {children}
      </div>
    </dialog>
  );
}

interface ModalHeaderProps {
  title: string;
  titleId: string;
  subtitle?: string;
  thumb?: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
}

export function ModalHeader({
  title,
  titleId,
  subtitle,
  thumb,
  onClose,
  closeDisabled = false,
}: ModalHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {thumb ? <div className="shrink-0">{thumb}</div> : null}
      <div className="min-w-0 flex-1">
        <h2
          id={titleId}
          className="font-display text-2xl font-extrabold leading-tight text-ink"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Fechar"
        className="bg-ground"
      >
        <CloseIcon className="h-5 w-5" />
      </Button>
    </div>
  );
}
