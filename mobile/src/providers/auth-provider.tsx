import { router } from 'expo-router';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { ApiError, setUnauthorizedHandler } from '@/lib/api/client';
import { authApi } from '@/lib/api/services';

import { queryClient } from './query-provider';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';
type AuthContextValue = {
  status: AuthStatus;
  username: string | null;
  notice: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissNotice: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [username, setUsername] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const handlingUnauthorized = useRef(false);

  const expire = useCallback(() => {
    if (handlingUnauthorized.current) return;
    handlingUnauthorized.current = true;
    setStatus('anonymous');
    setUsername(null);
    setNotice('Sessão expirada. Entre novamente.');
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'admin' || query.queryKey[0] === 'dashboard' });
    router.replace('/login');
    setTimeout(() => { handlingUnauthorized.current = false; }, 500);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(expire);
    authApi.check().then((result) => {
      setUsername(result.username);
      setStatus('authenticated');
    }).catch((error) => {
      if (!(error instanceof ApiError && error.status === 401)) setNotice('Não foi possível verificar a sessão. Você pode navegar pelo catálogo.');
      setStatus('anonymous');
    });
    return () => setUnauthorizedHandler(null);
  }, [expire]);

  const login = async (name: string, password: string) => {
    const result = await authApi.login({ username: name, password });
    setUsername(result.username);
    setStatus('authenticated');
    setNotice(null);
  };

  const logout = async () => {
    await authApi.logout();
    setStatus('anonymous');
    setUsername(null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'admin' || query.queryKey[0] === 'dashboard' });
  };

  return <AuthContext.Provider value={{ status, username, notice, login, logout, dismissNotice: () => setNotice(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
