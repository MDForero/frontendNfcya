'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMyProfile, OwnProfile } from '@/lib/api/profiles';
import { apiErrorMessage, apiStatus } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';

/** Solo estos roles tienen perfil digital propio (el backend responde 403 al resto). */
export const PROFILE_OWNER_ROLES = ['CLIENTE', 'EMPRESA'];

export type MyProfileState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: OwnProfile };

/** Carga el perfil propio; `reload()` vuelve a pedirlo, `setProfile` aplica una respuesta de la API. */
export function useMyProfile() {
  const { user } = useAuth();
  const canOwn = !!user && PROFILE_OWNER_ROLES.includes(user.role);
  const [state, setState] = useState<MyProfileState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!canOwn) return;
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setState({ status: 'ready', profile });
      })
      .catch((error) => {
        if (cancelled) return;
        if (apiStatus(error) === 404) setState({ status: 'missing' });
        else setState({ status: 'error', message: apiErrorMessage(error, 'No se pudo cargar tu perfil.') });
      });
    return () => {
      cancelled = true;
    };
  }, [canOwn, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setProfile = useCallback((profile: OwnProfile) => setState({ status: 'ready', profile }), []);

  return { state: canOwn ? state : ({ status: 'forbidden' } as const), reload, setProfile };
}
