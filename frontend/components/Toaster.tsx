"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  InfoIcon,
} from "./icons";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  text?: string;
  duration: number | null;
}

interface ToastApi {
  success: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
  warning: (title: string, text?: string) => void;
  info: (title: string, text?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const variantStyle: Record<
  ToastVariant,
  { icon: ReactNode; iconBg: string; role: "status" | "alert" }
> = {
  success: {
    icon: <CheckIcon className="h-5 w-5" />,
    iconBg: "bg-success text-success-ink",
    role: "status",
  },
  warning: {
    icon: <AlertIcon className="h-5 w-5" />,
    iconBg: "bg-warning text-warning-ink",
    role: "alert",
  },
  error: {
    icon: <AlertIcon className="h-5 w-5" />,
    iconBg: "bg-error text-error-ink",
    role: "alert",
  },
  info: {
    icon: <InfoIcon className="h-5 w-5" />,
    iconBg: "bg-info text-info-ink",
    role: "status",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, text?: string) => {
      const id = nextId.current;
      nextId.current += 1;
      const duration =
        variant === "success" || variant === "info" ? 5_000 : null;

      setToasts((current) =>
        [...current, { id, variant, title, text, duration }].slice(-4),
      );
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, text) => push("success", title, text),
      error: (title, text) => push("error", title, text),
      warning: (title, text) => push("warning", title, text),
      info: (title, text) => push("info", title, text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed left-4 right-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:w-[390px]"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: number) => void;
}) {
  const [remaining, setRemaining] = useState(toast.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const style = variantStyle[toast.variant];

  useEffect(() => {
    if (toast.duration == null || paused) return;

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 100) {
          window.clearInterval(interval);
          onRemove(toast.id);
          return 0;
        }
        return current - 100;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [toast.duration, toast.id, paused, onRemove]);

  return (
    <div
      role={style.role}
      className="toast-card pointer-events-auto w-full overflow-hidden rounded-2xl bg-surface shadow-[0_10px_30px_rgba(23,21,59,.18)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{toast.title}</p>
          {toast.text ? (
            <p className="mt-0.5 text-[13px] text-muted">{toast.text}</p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(toast.id)}
          aria-label="Fechar notificação"
          className="h-11 w-11 shrink-0"
        >
          <CloseIcon className="h-4 w-4" />
        </Button>
      </div>
      {toast.duration ? (
        <div className="h-1 w-full bg-line-soft" aria-hidden="true">
          <div
            className="h-full origin-left bg-violet transition-transform duration-100 ease-linear"
            style={{
              transform: `scaleX(${remaining / toast.duration})`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}
