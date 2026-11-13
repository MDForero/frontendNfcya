import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PublicSpinner } from '@/components/profile/public-states';
import { GoogleCallbackClient } from './google-callback-client';

export const metadata: Metadata = { title: 'Iniciando sesión', robots: { index: false } };

/** Destino de la API tras el login con Google (FRONTEND_URL/auth/callback[?error=…]). */
export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<PublicSpinner label="Iniciando sesión…" />}>
      <GoogleCallbackClient />
    </Suspense>
  );
}
