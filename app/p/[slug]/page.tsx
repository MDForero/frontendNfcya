import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PublicSpinner } from '@/components/profile/public-states';
import { PublicProfileClient } from './public-profile-client';

export const metadata: Metadata = {
  title: 'Perfil',
  // Los perfiles se comparten por enlace/NFC/QR; no se indexan mientras no haya decisión de negocio.
  robots: { index: false, follow: false },
};

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<PublicSpinner label="Cargando perfil…" />}>
      <PublicProfileClient params={params} />
    </Suspense>
  );
}
