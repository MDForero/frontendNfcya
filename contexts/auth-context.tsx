'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User, LoginData } from '@/lib/api/auth';
import * as authApi from '@/lib/api/auth';
import {
  endSession,
  isTransientError,
  onSessionChange,
  refreshSession,
  setAccessToken,
} from '@/lib/api/client';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
  /** Restaura la sesión si aún no se intentó (las páginas públicas no lo hacen al cargar). */
  ensureSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Páginas públicas (perfil y resolución NFC/QR): no necesitan restaurar sesión al cargar. */
export const PUBLIC_PREFIXES = ['/p/', '/r/'];
const isPublicPath = (pathname: string | null) =>
  !!pathname && PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

/** Renovación proactiva: 5 minutos antes de que caduque el access token. */
const REFRESH_MARGIN_SECONDS = 300;
// Reintentos ante fallos pasajeros del refresh (429 por rate limit, sin red).
const TRANSIENT_RETRY_SECONDS = 30;
const INITIAL_RETRY_DELAY_MS = 3000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // El temporizador vive en un ref para no re-ejecutar efectos al reprogramarlo.
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La restauración corre una sola vez (StrictMode ejecuta los efectos dos veces en dev).
  const initStartedRef = useRef(false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresIn: number) => {
      clearRefreshTimer();
      const delay = (expiresIn - REFRESH_MARGIN_SECONDS) * 1000;
      if (delay <= 0) return;
      // Si falla por algo pasajero (429, red) se reintenta mientras el token siga vigente;
      // si no, el siguiente 401 lo gestiona el interceptor.
      const arm = (ms: number, retriesLeft: number) => {
        refreshTimerRef.current = setTimeout(() => {
          refreshSession().catch((error) => {
            if (retriesLeft > 0 && isTransientError(error)) arm(TRANSIENT_RETRY_SECONDS * 1000, retriesLeft - 1);
          });
        }, ms);
      };
      arm(delay, Math.floor(REFRESH_MARGIN_SECONDS / TRANSIENT_RETRY_SECONDS) - 1);
    },
    [clearRefreshTimer],
  );

  // Toda renovación (inicial, proactiva o del interceptor) pasa por aquí: un único timer.
  useEffect(
    () =>
      onSessionChange((session) => {
        if (session) {
          setUser(session.user);
          scheduleRefresh(session.expiresIn);
        } else {
          setUser(null);
          clearRefreshTimer();
        }
      }),
    [scheduleRefresh, clearRefreshTimer],
  );

  useEffect(() => clearRefreshTimer, [clearRefreshTimer]);

  const ensureSession = useCallback(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    // Un fallo pasajero al cargar (429, red) no debe mandar al login a quien tiene sesión:
    // se reintenta un par de veces antes de darla por perdida.
    const restore = (attemptsLeft: number): Promise<unknown> =>
      refreshSession().catch((error) => {
        if (attemptsLeft > 0 && isTransientError(error)) {
          return new Promise((resolve) => setTimeout(resolve, INITIAL_RETRY_DELAY_MS)).then(() =>
            restore(attemptsLeft - 1),
          );
        }
        setAccessToken(null);
      });
    restore(2).finally(() => setIsLoading(false));
  }, []);

  // Restaura la sesión al cargar, salvo en páginas públicas (perfil, NFC/QR). Se lee
  // window.location en el efecto para no bloquear el prerender con usePathname().
  useEffect(() => {
    if (!isPublicPath(window.location.pathname)) ensureSession();
  }, [ensureSession]);

  const login = async (data: LoginData) => {
    const response = await authApi.login(data);
    setAccessToken(response.accessToken);
    setUser(response.user);
    scheduleRefresh(response.expiresIn);
    // Por si el login ocurrió antes de terminar la restauración inicial.
    setIsLoading(false);
  };

  const finishLogout = async (call: () => Promise<void>) => {
    try {
      await call();
    } catch {
      // Aunque la API falle, la sesión local se limpia igual.
    } finally {
      // RequireAuth ve user = null y lleva a /login (una sola navegación).
      clearRefreshTimer();
      endSession();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout: () => finishLogout(authApi.logout),
    logoutAll: () => finishLogout(authApi.logoutAll),
    updateUser: setUser,
    ensureSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
