'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveCode } from '@/lib/api/profiles';
import { apiStatus } from '@/lib/api/client';
import { PublicMessage, PublicSpinner } from '@/components/profile/public-states';

/**
 * Destino grabado en el chip NFC o impreso en el QR (/r/:code). Resuelve el código opaco y
 * reemplaza la URL por la del perfil, marcando la fuente para los leads.
 */
export function ResolveCodeClient({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [failure, setFailure] = useState<'unavailable' | 'error' | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveCode(code)
      .then(({ slug, kind }) => {
        if (!cancelled) router.replace(`/p/${encodeURIComponent(slug)}?src=${kind.toLowerCase()}`);
      })
      .catch((error) => {
        if (!cancelled) setFailure(apiStatus(error) === 404 ? 'unavailable' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (failure === 'unavailable') {
    return (
      <PublicMessage
        title="Código no disponible"
        description="Este código NFC/QR no está activo o el perfil asociado no está publicado."
      />
    );
  }
  if (failure === 'error') {
    return (
      <PublicMessage
        title="No pudimos abrir el perfil"
        description="Revisa tu conexión e inténtalo de nuevo."
        action={{ label: 'Reintentar', onClick: () => window.location.reload() }}
      />
    );
  }
  return <PublicSpinner label="Abriendo perfil…" />;
}
