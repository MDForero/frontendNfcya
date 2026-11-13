'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getSafeCallbackUrl } from '@/lib/utils/callback-url';

// Route protection lives on the client: the refresh cookie (nfcya_rt) belongs to
// the API origin with Path=/auth, so a Next.js middleware/proxy can never see it.
// These guards only shape navigation; the API enforces authorization on every call.

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-fill-2 border-t-brand" />
    </div>
  );
}

/** Renders children only with a session; otherwise sends the user to /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, ensureSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(ensureSession, [ensureSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading || !isAuthenticated) return <FullScreenSpinner />;
  return <>{children}</>;
}

// Pages that stay reachable with a session (the email link must work either way)
const ALWAYS_PUBLIC = ['/verify-email'];

/**
 * Sends an already authenticated user away from login/register/recovery pages.
 * The page renders right away (also on the server) and is only swapped for a
 * spinner once a session is confirmed, so these routes navigate instantly.
 */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, ensureSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(ensureSession, [ensureSession]);
  const applies = !ALWAYS_PUBLIC.some((route) => pathname.startsWith(route));
  const redirecting = applies && !isLoading && isAuthenticated;

  useEffect(() => {
    // Mismo destino que el formulario de login (callbackUrl): si no, este replace pisaría su push.
    if (redirecting) router.replace(getSafeCallbackUrl());
  }, [redirecting, router]);

  if (redirecting) return <FullScreenSpinner />;
  return <>{children}</>;
}
