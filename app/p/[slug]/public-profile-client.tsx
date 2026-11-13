'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Contact } from 'lucide-react';
import { getPublicProfile, LeadSource, PublicProfile, vcardUrl } from '@/lib/api/profiles';
import { apiStatus } from '@/lib/api/client';
import { profileAccent, profileButtonClass, PublicProfileCard } from '@/components/profile/public-profile-card';
import { LeadForm } from '@/components/profile/lead-form';
import { PublicMessage, PublicSpinner } from '@/components/profile/public-states';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; profile: PublicProfile }
  | { kind: 'unavailable' }
  | { kind: 'error'; rateLimited: boolean };

const SOURCES: Record<string, LeadSource> = { nfc: 'NFC', qr: 'QR' };

function PublicProfileContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const source = SOURCES[searchParams.get('src') ?? ''] ?? 'PROFILE';
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPublicProfile(slug)
      .then((profile) => {
        if (cancelled) return;
        setState({ kind: 'ready', profile });
        document.title = `${profile.displayName} · NFCya`;
      })
      .catch((error) => {
        if (cancelled) return;
        const status = apiStatus(error);
        // Inexistente, borrador o suspendido responden igual (404): no se revela cuál.
        setState(status === 404 ? { kind: 'unavailable' } : { kind: 'error', rateLimited: status === 429 });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  if (state.kind === 'loading') return <PublicSpinner label="Cargando perfil…" />;

  if (state.kind === 'unavailable') {
    return (
      <PublicMessage
        title="Perfil no disponible"
        description="Este perfil no existe o no está publicado en este momento."
      />
    );
  }

  if (state.kind === 'error') {
    return (
      <PublicMessage
        title="No pudimos cargar el perfil"
        description={
          state.rateLimited
            ? 'Hay demasiadas solicitudes. Espera un momento.'
            : 'Revisa tu conexión e inténtalo de nuevo.'
        }
        action={{
          label: 'Reintentar',
          onClick: () => {
            setState({ kind: 'loading' });
            setAttempt((n) => n + 1);
          },
        }}
      />
    );
  }

  const { profile } = state;
  return (
    <PublicProfileCard profile={profile}>
      <a
        href={vcardUrl(profile.slug)}
        className={profileButtonClass(profile.theme, 'primary')}
        style={{ background: profileAccent(profile.theme) }}
      >
        <Contact className="h-5 w-5" aria-hidden="true" /> Guardar contacto
      </a>
      {profile.leadsEnabled && <LeadForm slug={profile.slug} source={source} theme={profile.theme} />}
    </PublicProfileCard>
  );
}

export function PublicProfileClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <PublicProfileContent slug={slug} />;
}
