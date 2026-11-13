'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PublicSpinner } from '@/components/profile/public-states';

// Códigos que envía la API (ver README del backend → Login con Google).
const ERRORS: Record<string, string> = {
  google_disabled: 'El inicio de sesión con Google no está disponible en este momento.',
  oauth_failed: 'Se canceló el inicio de sesión con Google o la solicitud caducó. Inténtalo de nuevo.',
  email_not_verified: 'Tu cuenta de Google no tiene el email verificado.',
  account_suspended: 'Tu cuenta está suspendida. Contacta al soporte.',
};

export function GoogleCallbackClient() {
  const error = useSearchParams().get('error');
  // AuthProvider ya restauró la sesión con la cookie que escribió la API.
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const succeeded = !error && !isLoading && isAuthenticated;

  useEffect(() => {
    if (succeeded) router.replace('/dashboard');
  }, [succeeded, router]);

  if (!error && (isLoading || isAuthenticated)) return <PublicSpinner label="Iniciando sesión…" />;

  const message = (error && ERRORS[error]) || 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-ink">Inicio de sesión con Google</h1>
        <p role="alert" className="mt-2 text-sm text-danger">
          {message}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    </main>
  );
}
