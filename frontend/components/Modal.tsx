"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
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

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const targets = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]",
      ),
    ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest("[inert]"));
    const first = targets[0];
    const last = targets.at(-1);
    if (!first || !last) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

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
      onKeyDown={trapFocus}
      className={`modal-dialog m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] overflow-visible bg-transparent p-0 outline-none ${widthClass}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current && !closeDisabled) onClose();
      }}
    >
      <div className="modal-panel mx-auto max-h-[calc(100dvh-32px)] w-full overflow-y-auto overscroll-contain rounded-[28px] border border-line bg-surface p-5 text-ink shadow-[0_28px_100px_-20px_rgba(0,0,0,.32)] sm:p-7">
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
