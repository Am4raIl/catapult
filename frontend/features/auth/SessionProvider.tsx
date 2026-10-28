"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/Toaster";
import { authApi } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  status: SessionStatus;
  username: string | null;
}

interface SessionContextValue extends SessionState {
  signIn: (username: string) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    status: "loading",
    username: null,
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const handlingUnauthorized = useRef(false);

  useEffect(() => {
    let cancelled = false;

    authApi
      .check()
      .then((response) => {
        if (!cancelled) {
          setSession({ status: "authenticated", username: response.username });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession({ status: "unauthenticated", username: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (handlingUnauthorized.current) return;
      handlingUnauthorized.current = true;
      window.setTimeout(() => {
        handlingUnauthorized.current = false;
      }, 1_500);

      setSession({ status: "unauthenticated", username: null });
      queryClient.clear();
      toast.warning("Sessão expirada", "Entre novamente para continuar.");

      if (!window.location.pathname.startsWith("/login")) {
        const current = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?from=${encodeURIComponent(current)}`);
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [queryClient, router, toast]);

  const signIn = useCallback((username: string) => {
    setSession({ status: "authenticated", username });
  }, []);

  const signOut = useCallback(() => {
    setSession({ status: "unauthenticated", username: null });
  }, []);

  return (
    <SessionContext.Provider value={{ ...session, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession deve ser usado dentro de SessionProvider");
  }
  return context;
}
