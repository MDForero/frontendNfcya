'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
  leaving: boolean;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Duración visible: los errores se quedan más tiempo para poder leerlos. */
const DURATION: Record<ToastVariant, number> = { success: 3500, info: 4000, error: 6000 };
const EXIT_MS = 200;
const MAX_VISIBLE = 4;

/**
 * Notificaciones emergentes. Uso:
 *   const toast = useToast();
 *   toast.success('Cambios guardados.');
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = ++nextId.current;
    setToasts((prev) => {
      // Evita duplicados idénticos (p. ej. doble clic) y limita la pila.
      // Un éxito sustituye a los errores anteriores: ya no son relevantes.
      const rest = prev.filter(
        (t) => !(t.message === message && t.variant === variant) && !(variant === 'success' && t.variant === 'error'),
      );
      return [...rest, { id, variant, message, leaving: false }].slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 sm:top-20 sm:right-6 sm:left-auto sm:items-end sm:px-0"
      >
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const STYLES: Record<ToastVariant, { icon: typeof Info; iconClass: string; bar: string }> = {
  success: { icon: CircleCheck, iconClass: 'text-success', bar: 'bg-success' },
  error: { icon: CircleAlert, iconClass: 'text-danger', bar: 'bg-danger' },
  info: { icon: Info, iconClass: 'text-brand', bar: 'bg-brand' },
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const { icon: Icon, iconClass, bar } = STYLES[item.variant];
  const [paused, setPaused] = useState(false);
  const duration = DURATION[item.variant];

  // Temporizador que respeta las pausas (hover / foco).
  const remaining = useRef(duration);
  useEffect(() => {
    if (paused || item.leaving) return;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, item.leaving, item.id, onDismiss]);

  return (
    <div
      role={item.variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto relative flex w-full max-w-[380px] items-start gap-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white py-3.5 pr-3 pl-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)] motion-safe:duration-200 ${
        item.leaving
          ? 'motion-safe:animate-out motion-safe:fade-out-0 motion-safe:slide-out-to-top-2 opacity-0'
          : 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-3'
      }`}
    >
      <Icon className={`mt-px h-5 w-5 shrink-0 ${iconClass}`} aria-hidden="true" />
      <p className="flex-1 text-[15px] leading-snug text-ink">{item.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Cerrar notificación"
        className="-mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-fill hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      {!item.leaving && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 left-0 h-[3px] w-full origin-left ${bar} opacity-60`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
}
