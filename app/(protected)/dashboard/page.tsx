'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Inbox, Link2, QrCode, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatRole, getRoleBadgeColor } from '@/lib/utils/auth-helpers';
import { navItemsFor } from '@/lib/navigation';
import { Identifier, listIdentifiers, listMyLeads, OwnProfile, STATUS_LABELS } from '@/lib/api/profiles';
import { useMyProfile } from '@/hooks/use-my-profile';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/profile/page-states';
import { CopyButton } from '@/components/profile/copy-button';
import { profileAccent } from '@/components/profile/public-profile-card';
import { getInitials } from '@/lib/utils/auth-helpers';

const statusVariant = (status: OwnProfile['status']) =>
  status === 'PUBLISHED' ? 'success' : status === 'SUSPENDED' ? 'destructive' : 'secondary';

/** Mini teléfono con la silueta del perfil (decorativo). */
function PhoneThumb({ profile }: { profile: OwnProfile }) {
  const accent = profileAccent(profile.theme);
  return (
    <div aria-hidden="true" className="flex h-[260px] w-[200px] flex-col items-center overflow-hidden rounded-[32px] border-[6px] border-ink bg-background">
      <div className="h-16 w-full" style={{ background: accent }} />
      <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-brand-soft font-bold text-brand-strong">
        {getInitials(profile.displayName)}
      </div>
      <div className="mt-2 h-2.5 w-24 rounded-full bg-ink" />
      <div className="mt-1.5 h-[7px] w-32 rounded-full bg-[#c7c7cc]" />
      <div className="mt-3.5 h-[26px] w-40 rounded-lg bg-white" />
      <div className="mt-1.5 h-[26px] w-40 rounded-lg bg-white" />
      <div className="mt-2.5 h-[26px] w-40 rounded-full" style={{ background: accent }} />
    </div>
  );
}

function StatTile({
  href,
  icon: Icon,
  iconClass,
  label,
  value,
  detail,
  dark = false,
}: {
  href: string;
  icon: typeof Inbox;
  iconClass: string;
  label: string;
  value: string;
  detail: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[200px] flex-col gap-2.5 rounded-[28px] p-6 transition-transform hover:scale-[1.01] sm:p-7 ${
        dark ? 'bg-ink text-white' : 'bg-white text-ink'
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${iconClass}`}>
        <Icon className="h-[22px] w-[22px]" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className={`mt-auto text-[15px] ${dark ? 'text-[#c7c7cc]' : 'text-ink-3'}`}>{label}</span>
      <span className="text-[40px] leading-none font-extrabold tracking-[-0.04em]">{value}</span>
      <span className={`text-[15px] ${dark ? 'text-[#e5e5ea]' : 'text-ink-3'}`}>{detail}</span>
    </Link>
  );
}

/** Contadores de NFC/QR y contactos (solo para quien tiene perfil). */
function useOwnerStats(enabled: boolean) {
  const [stats, setStats] = useState<{ identifiers: Identifier[]; leads: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.all([listIdentifiers(), listMyLeads(1, 1)])
      .then(([identifiers, leads]) => {
        if (!cancelled) setStats({ identifiers, leads: leads.total });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return stats;
}

function OwnerOverview() {
  const { state } = useMyProfile();
  const profile = state.status === 'ready' ? state.profile : null;
  const stats = useOwnerStats(!!profile);

  if (state.status === 'loading') return <PageSpinner />;
  if (state.status === 'error') return <p className="rounded-2xl bg-danger-soft p-4 text-[#b00012]">{state.message}</p>;
  if (state.status === 'missing') {
    return (
      <section className="flex flex-col items-start gap-4 rounded-[28px] bg-white p-7 sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-orange-soft text-orange-ink">
          <QrCode className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-bold tracking-tight">Tu perfil digital</h2>
        <p className="text-[17px] text-ink-3">Aún no has creado tu perfil.</p>
        <Link href="/profile" className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-[17px] font-semibold text-white hover:bg-brand-strong">
          Crear mi perfil
        </Link>
      </section>
    );
  }
  if (!profile) return null;

  const visibleLinks = profile.links.filter((l) => l.isActive).length;
  const hiddenLinks = profile.links.length - visibleLinks;
  const active = stats?.identifiers.filter((i) => i.status === 'ACTIVE').length ?? 0;
  const inactive = stats?.identifiers.filter((i) => i.status === 'INACTIVE').length ?? 0;
  const [path, slug] = [profile.publicUrl.replace(/^https?:\/\//, '').replace(profile.slug, ''), profile.slug];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
      <section className="col-span-full flex flex-wrap items-center gap-7 rounded-[28px] bg-white p-6 sm:p-8">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">Tu perfil</h2>
            <Badge variant={statusVariant(profile.status)}>{STATUS_LABELS[profile.status]}</Badge>
          </div>
          <p className="text-[15px] text-ink-3">Dirección pública</p>
          <p className="-mt-2 text-[22px] font-semibold tracking-tight [overflow-wrap:anywhere]">
            {path}
            <span className="text-brand">{slug}</span>
          </p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {profile.status === 'PUBLISHED' && (
              <a
                href={`/p/${profile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-[15px] font-semibold text-white hover:bg-brand-strong"
              >
                Ver mi perfil
              </a>
            )}
            <CopyButton value={profile.publicUrl} label="Copiar enlace" className="h-11 px-5 text-[15px]" />
            <Link href="/profile" className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-[15px] font-semibold text-ink hover:bg-fill-2">
              Editar
            </Link>
          </div>
        </div>
        <div className="hidden flex-[1_1_220px] justify-center sm:flex">
          <PhoneThumb profile={profile} />
        </div>
      </section>

      <StatTile
        href="/leads"
        dark
        icon={Inbox}
        iconClass="bg-orange text-ink"
        label="Contactos recibidos"
        value={stats ? String(stats.leads) : '—'}
        detail={profile.leadsEnabled ? 'Formulario de contacto activo' : 'Formulario de contacto desactivado'}
      />
      <StatTile
        href="/nfc-qr"
        icon={QrCode}
        iconClass="bg-brand-soft text-brand-strong"
        label="NFC y QR"
        value={stats ? `${active} activo${active === 1 ? '' : 's'}` : '—'}
        detail={stats ? `${inactive} desactivado${inactive === 1 ? '' : 's'}` : 'Cargando…'}
      />
      <StatTile
        href="/links"
        icon={Link2}
        iconClass="bg-success-soft text-success-ink"
        label="Enlaces"
        value={`${visibleLinks} visible${visibleLinks === 1 ? '' : 's'}`}
        detail={`${hiddenLinks} oculto${hiddenLinks === 1 ? '' : 's'} · máximo 20`}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const isOwner = user.role === 'CLIENTE' || user.role === 'EMPRESA';
  const adminSections = navItemsFor(user.role).filter((item) => item.href.startsWith('/admin'));
  const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="space-y-7">
      <div>
        <p className="text-[15px] font-semibold text-ink-3 first-letter:uppercase">{today}</p>
        <h1 className="large-title mt-1 text-[36px] sm:text-[52px]">Hola, {user.name.split(' ')[0]}.</h1>
        <p className="mt-2 text-[17px] text-ink-3 sm:text-[19px]">
          {isOwner ? 'Gestiona tu tarjeta digital, tus enlaces y tus códigos.' : 'Panel de administración de NFCya.'}
        </p>
      </div>

      {isOwner && <OwnerOverview />}

      {adminSections.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
          {adminSections.map((item) => (
            <StatTile
              key={item.href}
              href={item.href}
              dark
              icon={ShieldCheck}
              iconClass="bg-orange text-ink"
              label={item.label}
              value="Perfiles"
              detail={user.role === 'EMPRESA' ? 'Clientes de tu organización' : 'Buscar, revisar y suspender'}
            />
          ))}
        </div>
      )}

      <section>
        <h2 className="group-label">Tu cuenta</h2>
        <div className="divide-y divide-separator overflow-hidden rounded-[20px] bg-white">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
            <span className="flex-[1_1_140px] text-base font-medium">Email</span>
            <span className="text-base text-ink-3 [overflow-wrap:anywhere]">{user.email}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
            <span className="flex-[1_1_140px] text-base font-medium">Rol</span>
            <Badge className={getRoleBadgeColor(user.role)}>{formatRole(user.role)}</Badge>
          </div>
          <Link href="/change-password" className="flex min-h-[52px] items-center gap-4 px-5 py-3.5 hover:bg-black/[0.02]">
            <span className="flex-1 text-base font-medium">Cambiar contraseña</span>
            <ChevronRight className="h-4 w-4 text-[#aeaeb2]" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
