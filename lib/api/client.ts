import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from './auth';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envía la cookie httpOnly de refresh (Path=/auth)
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Access token (solo en memoria; nunca en localStorage) ---

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// --- Eventos de sesión: AuthProvider se entera de refresh y expiraciones del interceptor ---

type SessionListener = (session: AuthResponse | null) => void;
const listeners = new Set<SessionListener>();

/** Suscribe a cambios de sesión (null = sesión perdida). Devuelve la función para desuscribirse. */
export function onSessionChange(listener: SessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitSession(session: AuthResponse | null) {
  listeners.forEach((listener) => listener(session));
}

// --- Refresh único ---

let refreshPromise: Promise<AuthResponse> | null = null;

/**
 * Renueva la sesión con la cookie de refresh. Todas las llamadas simultáneas comparten la
 * misma petición: el backend rota el refresh token y reutilizar uno ya rotado revoca TODAS
 * las sesiones del usuario, así que nunca deben salir dos /auth/refresh a la vez.
 */
export function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<AuthResponse>('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        emitSession(data);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Fallo pasajero (sin red, 429 por rate limit o 5xx): el refresh token sigue siendo válido,
 * así que no hay que tratarlo como «sesión perdida» ni mandar al usuario al login.
 */
export function isTransientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status === 429 || status >= 500;
}

/** Limpia la sesión local y avisa a los suscriptores (RequireAuth redirige a /login una sola vez). */
export function endSession() {
  setAccessToken(null);
  emitSession(null);
}

// Rutas donde un 401 significa "credenciales/sesión inválidas", no "token caducado".
const NO_RETRY_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
];

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const skip = !original || NO_RETRY_PATHS.some((path) => original.url?.startsWith(path));

    if (error.response?.status !== 401 || skip || original._retry) {
      return Promise.reject(error);
    }

    // Reintenta la petición original una sola vez tras renovar.
    original._retry = true;
    try {
      await refreshSession();
    } catch (refreshError) {
      // Fallo pasajero: la sesión sigue viva; solo falla esta petición (con su mensaje).
      if (isTransientError(refreshError)) return Promise.reject(refreshError);
      // La renovación falló: sesión perdida. AuthProvider limpia el usuario y
      // RequireAuth lleva a /login (una sola redirección, aunque fallen varias peticiones).
      endSession();
      return Promise.reject(refreshError);
    }
    return apiClient(original);
  },
);

/** Mensaje legible de un error de la API (class-validator devuelve un array en `message`). */
export function apiErrorMessage(error: unknown, fallback = 'Ocurrió un error. Inténtalo de nuevo.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    if (error.response.status === 429) return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

export function apiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export default apiClient;
