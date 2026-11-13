'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink, Pencil } from 'lucide-react';
import {
  checkSlug,
  createProfile,
  OwnProfile,
  ProfileFields,
  ProfileTheme,
  publishProfile,
  STATUS_LABELS,
  THEMES,
  unpublishProfile,
  updateProfile,
} from '@/lib/api/profiles';
import { apiErrorMessage, apiStatus } from '@/lib/api/client';
import { useMyProfile } from '@/hooks/use-my-profile';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import { GroupedList, PageHeader, ProfileGate } from '@/components/profile/page-states';
import { profileAccent, PublicProfileCard } from '@/components/profile/public-profile-card';
import { CopyButton } from '@/components/profile/copy-button';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type Form = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  phone: string;
  email: string;
  website: string;
  locationLabel: string;
  showEmail: boolean;
  showPhone: boolean;
  leadsEnabled: boolean;
  theme: ProfileTheme;
};

const TEXT_FIELDS = [
  'slug',
  'displayName',
  'headline',
  'bio',
  'avatarUrl',
  'coverUrl',
  'phone',
  'email',
  'website',
  'locationLabel',
] as const;

function toForm(profile: OwnProfile | null, fallbackName = ''): Form {
  return {
    slug: profile?.slug ?? '',
    displayName: profile?.displayName ?? fallbackName,
    headline: profile?.headline ?? '',
    bio: profile?.bio ?? '',
    avatarUrl: profile?.avatarUrl ?? '',
    coverUrl: profile?.coverUrl ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
    website: profile?.website ?? '',
    locationLabel: profile?.locationLabel ?? '',
    showEmail: profile?.showEmail ?? false,
    showPhone: profile?.showPhone ?? false,
    leadsEnabled: profile?.leadsEnabled ?? false,
    theme: profile?.theme ?? 'DEFAULT',
  };
}

/** "" se envía tal cual: el backend lo convierte en null (borra el campo). */
function toPayload(form: Form): ProfileFields {
  const payload = { ...form } as Record<string, unknown>;
  for (const field of TEXT_FIELDS) payload[field] = form[field].trim();
  return payload as unknown as ProfileFields;
}

/** Misma normalización que el backend, para mostrar el slug resultante mientras se escribe. */
function previewSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

type SlugResult = { slug: string; available: boolean; message: string };
type SlugCheck = { state: 'idle' | 'checking' | 'ok' | 'taken'; message?: string };

export default function ProfilePage() {
  const { user } = useAuth();
  const { state, reload, setProfile } = useMyProfile();

  if (state.status !== 'ready' && state.status !== 'missing') {
    return (
      <>
        <PageHeader title="Mi perfil" />
        <ProfileGate state={state} onRetry={reload} />
      </>
    );
  }

  const profile = state.status === 'ready' ? state.profile : null;
  return (
    <ProfileEditor
      // Al crear el perfil cambia la key y el formulario se reinicia con los datos guardados.
      key={profile?.id ?? 'new'}
      profile={profile}
      defaultName={user?.name ?? ''}
      onSaved={setProfile}
    />
  );
}

function ProfileEditor({
  profile,
  defaultName,
  onSaved,
}: {
  profile: OwnProfile | null;
  defaultName: string;
  onSaved: (profile: OwnProfile) => void;
}) {
  const toast = useToast();
  const isNew = !profile;
  const [form, setForm] = useState<Form>(() => toForm(profile, defaultName));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [slugResult, setSlugResult] = useState<SlugResult | null>(null);

  const saved = useMemo(() => toForm(profile, defaultName), [profile, defaultName]);
  const dirty = isNew || JSON.stringify(form) !== JSON.stringify(saved);

  // Disponibilidad del slug: el efecto solo consulta (con debounce); el estado se deriva.
  const candidate = previewSlug(form.slug);
  const needsCheck = !!candidate && candidate !== profile?.slug;
  useEffect(() => {
    if (!needsCheck) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      checkSlug(candidate)
        .then((res) => {
          if (!cancelled)
            setSlugResult({ slug: candidate, available: res.available, message: res.available ? `Disponible: ${res.slug}` : (res.reason ?? 'No disponible') });
        })
        .catch(() => undefined);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [candidate, needsCheck]);

  const slugCheck: SlugCheck = !needsCheck
    ? { state: 'idle' }
    : slugResult?.slug !== candidate
      ? { state: 'checking' }
      : { state: slugResult.available ? 'ok' : 'taken', message: slugResult.message };

  const set =
    <K extends keyof Form>(field: K) =>
    (value: Form[K]) =>
      setForm((prev) => ({ ...prev, [field]: value }));
  const text = (field: (typeof TEXT_FIELDS)[number]) => ({
    id: field,
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(field)(e.target.value),
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) return toast.error('El nombre visible es obligatorio.');
    if (!previewSlug(form.slug)) return toast.error('Elige una dirección (slug) para tu perfil.');
    if (slugCheck.state === 'taken') return toast.error(slugCheck.message ?? 'El slug no está disponible.');

    setSaving(true);
    try {
      const payload = toPayload(form);
      const result = isNew ? await createProfile(payload) : await updateProfile(payload);
      onSaved(result);
      toast.success(isNew ? 'Perfil creado como borrador. Publícalo cuando esté listo.' : 'Cambios guardados.');
    } catch (err) {
      if (apiStatus(err) === 409) setSlugResult({ slug: candidate, available: false, message: apiErrorMessage(err) });
      toast.error(apiErrorMessage(err, 'No se pudo guardar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!profile) return;
    setPublishing(true);
    try {
      const published = profile.status === 'PUBLISHED';
      onSaved(published ? await unpublishProfile() : await publishProfile());
      toast.success(published ? 'Perfil despublicado: ya no es visible.' : 'Perfil publicado.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo cambiar la publicación.'));
    } finally {
      setPublishing(false);
    }
  };

  const previewProfile = {
    slug: previewSlug(form.slug),
    displayName: form.displayName || 'Tu nombre',
    headline: form.headline || null,
    bio: form.bio || null,
    avatarUrl: form.avatarUrl || null,
    coverUrl: form.coverUrl || null,
    website: form.website || null,
    locationLabel: form.locationLabel || null,
    email: form.showEmail ? form.email || null : null,
    phone: form.showPhone ? form.phone || null : null,
    theme: form.theme,
    leadsEnabled: form.leadsEnabled,
    links: (profile?.links ?? [])
      .filter((link) => link.isActive)
      .map(({ label, url, type }) => ({ label, url, type })),
  };

  const suspended = profile?.status === 'SUSPENDED';
  const published = profile?.status === 'PUBLISHED';

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title="Mi perfil"
        description={
          isNew ? 'Crea tu perfil digital para compartirlo por NFC o QR.' : 'Lo que ve quien acerca tu tarjeta o escanea tu QR.'
        }
        actions={
          profile && (
            <>
              <Badge variant={published ? 'success' : suspended ? 'destructive' : 'secondary'} className="h-8 px-3 text-sm">
                {STATUS_LABELS[profile.status]}
              </Badge>
              {!suspended && (
                <Button
                  type="button"
                  variant={published ? 'outline' : 'default'}
                  className="h-11 px-5"
                  onClick={togglePublish}
                  disabled={publishing || dirty}
                  title={dirty ? 'Guarda los cambios antes de publicar' : undefined}
                >
                  {publishing ? '…' : published ? 'Despublicar' : 'Publicar'}
                </Button>
              )}
            </>
          )
        }
      />

      {profile && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[20px] bg-white px-5 py-3.5">
          <span className="text-[15px] text-ink-3">URL pública</span>
          <span className="min-w-0 flex-1 truncate font-mono text-[15px] text-ink">{profile.publicUrl}</span>
          <div className="flex gap-2">
            <CopyButton value={profile.publicUrl} label="Copiar" />
            {published && (
              <a
                href={`/p/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 text-sm font-semibold text-brand-strong hover:bg-[#dbe9fc]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Ver
              </a>
            )}
          </div>
        </div>
      )}

      {suspended && (
        <Alert variant="destructive" className="mb-6">
          Tu perfil está suspendido por administración y no es visible. Contacta a soporte.
        </Alert>
      )}

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-7">
          <GroupedList title="Datos básicos">
            <FieldRow label="Nombre visible *" htmlFor="displayName">
              <RowInput {...text('displayName')} maxLength={120} required />
            </FieldRow>
            <FieldRow
              label="Dirección"
              htmlFor="slug"
              hint={
                <span id="slug-help">
                  {form.slug && previewSlug(form.slug) !== form.slug && (
                    <span className="text-ink-3">
                      Se guardará como <span className="font-mono">{previewSlug(form.slug) || '—'}</span>.{' '}
                    </span>
                  )}
                  {slugCheck.state === 'checking' && <span className="text-ink-3">Comprobando…</span>}
                  {slugCheck.state === 'ok' && <span className="font-medium text-success-ink">✓ {slugCheck.message}</span>}
                  {slugCheck.state === 'taken' && <span className="font-medium text-danger">{slugCheck.message}</span>}
                </span>
              }
            >
              <RowInput {...text('slug')} maxLength={60} placeholder="tu-nombre" aria-describedby="slug-help" />
            </FieldRow>
            <FieldRow label="Cargo o titular" htmlFor="headline">
              <RowInput {...text('headline')} maxLength={160} placeholder="Diseñadora gráfica" />
            </FieldRow>
            <FieldRow label="Ubicación" htmlFor="locationLabel">
              <RowInput {...text('locationLabel')} maxLength={120} placeholder="Bogotá, Colombia" />
            </FieldRow>
            <div className="flex flex-col gap-2 px-4 py-3.5">
              <label htmlFor="bio" className="text-base font-medium">
                Biografía
              </label>
              <textarea
                {...text('bio')}
                maxLength={1000}
                rows={4}
                className="w-full cursor-text resize-y rounded-xl border border-transparent bg-fill px-3.5 py-2.5 text-base leading-relaxed outline-none transition-colors hover:bg-fill-2 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-ring/20"
              />
              <span className="self-end text-xs text-ink-3">{form.bio.length}/1000</span>
            </div>
          </GroupedList>

          <GroupedList
            title="Contacto y privacidad"
            footer="El email y el teléfono son privados salvo que los muestres. Solo lo visible aparece en la vCard."
          >
            <FieldRow
              label="Teléfono"
              htmlFor="phone"
              hint={<span className="text-ink-3">En tu perfil se muestran los botones WhatsApp y Llamar. Incluye el indicativo (sin él se asume +57).</span>}
            >
              <RowInput {...text('phone')} type="tel" maxLength={30} placeholder="+57 300 123 4567" />
            </FieldRow>
            <SwitchRow id="showPhone" checked={form.showPhone} onChange={set('showPhone')} label="Mostrar teléfono en el perfil público" />
            <FieldRow label="Email de contacto" htmlFor="email">
              <RowInput {...text('email')} type="email" maxLength={254} />
            </FieldRow>
            <SwitchRow id="showEmail" checked={form.showEmail} onChange={set('showEmail')} label="Mostrar email en el perfil público" />
            <FieldRow label="Sitio web" htmlFor="website">
              <RowInput {...text('website')} type="url" maxLength={2048} placeholder="https://…" />
            </FieldRow>
            <SwitchRow
              id="leadsEnabled"
              checked={form.leadsEnabled}
              onChange={set('leadsEnabled')}
              label="Recibir contactos de visitantes"
              hint="Siempre con consentimiento explícito."
            />
          </GroupedList>

          <GroupedList title="Apariencia">
            <fieldset className="px-4 py-4">
              <legend className="sr-only">Tema</legend>
              <div className="flex flex-wrap gap-4">
                {THEMES.map((theme) => {
                  const checked = form.theme === theme.value;
                  return (
                    <label key={theme.value} className="flex cursor-pointer flex-col items-center gap-1.5 text-[13px]">
                      <input
                        type="radio"
                        name="theme"
                        value={theme.value}
                        checked={checked}
                        onChange={() => set('theme')(theme.value)}
                        className="peer sr-only"
                      />
                      <span
                        className={`h-[52px] w-[52px] rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand ${
                          theme.value === 'DEFAULT' ? 'border border-input' : ''
                        }`}
                        style={{
                          background: THEME_SWATCH[theme.value],
                          boxShadow: checked ? `0 0 0 3px #fff, 0 0 0 5px ${profileAccent(theme.value)}` : undefined,
                        }}
                        aria-hidden="true"
                      />
                      <span className={checked ? 'font-bold text-ink' : 'text-ink-2'}>{theme.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <FieldRow label="Foto (URL https)" htmlFor="avatarUrl">
              <RowInput {...text('avatarUrl')} type="url" maxLength={2048} placeholder="https://…" />
            </FieldRow>
            <FieldRow label="Portada (URL https)" htmlFor="coverUrl">
              <RowInput {...text('coverUrl')} type="url" maxLength={2048} placeholder="https://…" />
            </FieldRow>
          </GroupedList>

          {!isNew && (
            <Link href="/links" className="flex min-h-[56px] items-center gap-3 rounded-[20px] bg-white px-5 py-3 hover:bg-black/[0.02]">
              <span className="flex-1 text-base font-semibold">Gestionar enlaces</span>
              <ChevronRight className="h-4 w-4 text-[#aeaeb2]" strokeWidth={2.5} aria-hidden="true" />
            </Link>
          )}
        </div>

        <aside aria-label="Vista previa" className="flex w-full flex-[1_1_320px] flex-col items-center gap-3 lg:sticky lg:top-24">
          <p className="text-[13px] font-semibold tracking-[0.04em] text-ink-3 uppercase">Vista previa</p>
          <div className="w-full max-w-[320px] rounded-[44px] bg-ink p-2.5 shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
            {/* Como un teléfono real: se desplaza sin barra visible (que quedaba recortada por el marco).
                overscroll-contain evita que al llegar al final se desplace la página entera.
                tabIndex permite desplazarla con el teclado. */}
            <div
              tabIndex={0}
              aria-label="Vista previa del perfil (desplazable)"
              className="max-h-[640px] overflow-y-auto overscroll-contain rounded-[34px] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [&::-webkit-scrollbar]:hidden"
            >
              <PublicProfileCard profile={previewProfile} compact />
            </div>
          </div>
        </aside>
      </div>

      <div className="glass-white sticky bottom-[72px] z-20 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-[20px] px-5 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:bottom-4">
        <span className="text-[15px] text-ink-2">
          {isNew ? 'Completa tus datos y crea tu perfil.' : dirty ? 'Tienes cambios sin guardar.' : 'Todo está guardado.'}
        </span>
        <Button type="submit" size="lg" disabled={saving || (!dirty && !isNew)}>
          {saving ? 'Guardando…' : isNew ? 'Crear perfil' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

/** Campo de fila: etiqueta a la izquierda y valor a la derecha (apilados en móvil). */
const ROW_INPUT =
  'peer h-11 w-full min-w-0 cursor-text rounded-xl border border-transparent bg-fill pr-10 pl-3.5 text-base text-ink outline-none transition-colors placeholder:text-[#8e8e93] hover:bg-fill-2 focus-visible:border-primary focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-ring/20';

/**
 * Campo de texto con aspecto de campo editable: fondo gris (como en móvil), lápiz a la derecha
 * y tono más oscuro al pasar el ratón. Así se entiende sin instrucciones que se puede editar.
 */
function RowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input {...props} className={ROW_INPUT} />
      <Pencil
        className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-ink-3 transition-opacity peer-focus-visible:opacity-0"
        strokeWidth={2}
        aria-hidden="true"
      />
    </div>
  );
}

const THEME_SWATCH: Record<ProfileTheme, string> = {
  DEFAULT: '#ffffff',
  DARK: '#1d1d1f',
  OCEAN: '#0e7490',
  SUNSET: '#c2410c',
  FOREST: '#047857',
};

function FieldRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
      <label htmlFor={htmlFor} className="text-base font-medium sm:w-44 sm:shrink-0">
        {label}
      </label>
      <div className="min-w-0 sm:flex-1">{children}</div>
      {hint && <div className="text-[13px] sm:basis-full sm:text-right">{hint}</div>}
    </div>
  );
}

function SwitchRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[56px] items-center gap-4 px-4 py-3">
      <label htmlFor={id} className="flex flex-1 cursor-pointer flex-col gap-0.5">
        <span className="text-base">{label}</span>
        {hint && <span className="text-[13px] text-ink-3">{hint}</span>}
      </label>
      <Switch id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
