import { BrandIcon } from '@/components/brand/brand-mark';
import type { CSSProperties, ReactNode } from 'react';
import {
  Briefcase,
  Camera,
  ChevronRight,
  Globe,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  PlayCircle,
  Users,
} from 'lucide-react';
import type { LinkType, ProfileTheme, PublicProfile } from '@/lib/api/profiles';
import { getInitials } from '@/lib/utils/auth-helpers';

interface ThemeStyle {
  /** Color de acento: portada, iconos y botón principal (texto blanco encima, ≥ 4.5:1). */
  accent: string;
  /** Círculo decorativo de la portada. */
  blob: string;
  page: string;
  group: string;
  separator: string;
  text: string;
  muted: string;
  soft: string;
  avatar: string;
  secondaryButton: string;
}

const LIGHT = {
  page: 'bg-[#f5f5f7]',
  group: 'bg-white',
  separator: 'border-[#e5e5ea]',
  text: 'text-[#1d1d1f]',
  muted: 'text-[#6e6e73]',
  soft: 'bg-white text-[#3a3a3c]',
  avatar: 'bg-[#e8f1fd] text-[#0058b0]',
  secondaryButton: 'bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#dedee3]',
};

export const THEME_STYLES: Record<ProfileTheme, ThemeStyle> = {
  DEFAULT: { ...LIGHT, accent: '#0071e3', blob: '#ff7a1a' },
  OCEAN: { ...LIGHT, accent: '#0e7490', blob: '#ff7a1a' },
  SUNSET: { ...LIGHT, accent: '#c2410c', blob: '#ffd60a', avatar: 'bg-[#fff1e6] text-[#b4500a]' },
  FOREST: { ...LIGHT, accent: '#047857', blob: '#ff7a1a', avatar: 'bg-[#e6f4ea] text-[#1a7a35]' },
  DARK: {
    accent: '#0071e3',
    blob: '#ff7a1a',
    page: 'bg-black',
    group: 'bg-[#1c1c1e]',
    separator: 'border-[#38383a]',
    text: 'text-white',
    muted: 'text-[#a1a1a6]',
    soft: 'bg-[#1c1c1e] text-[#e5e5ea]',
    avatar: 'bg-[#2c2c2e] text-white',
    secondaryButton: 'bg-[#2c2c2e] text-white hover:bg-[#3a3a3c]',
  },
};

const LINK_ICONS: Record<LinkType, { icon: typeof Globe; tile?: string }> = {
  WEBSITE: { icon: Globe },
  INSTAGRAM: { icon: Camera, tile: '#c13584' },
  FACEBOOK: { icon: Users, tile: '#1877f2' },
  LINKEDIN: { icon: Briefcase, tile: '#0a66c2' },
  WHATSAPP: { icon: MessageCircle, tile: '#1e8e3e' },
  YOUTUBE: { icon: PlayCircle, tile: '#d70015' },
  TIKTOK: { icon: Music2, tile: '#1d1d1f' },
  OTHER: { icon: Link2, tile: '#6e6e73' },
};

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Defensa adicional en el cliente: el backend ya valida, pero nunca pintamos otro esquema. */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return SAFE_PROTOCOLS.includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}

/** Indicativo que se asume si el número no lo trae (Colombia). */
const DEFAULT_COUNTRY_CODE = '57';

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/**
 * Enlace de WhatsApp (wa.me exige el número internacional solo con dígitos). Si el número
 * no empieza con + y tiene 10 dígitos (celular colombiano sin indicativo), se antepone 57.
 */
export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const international = !phone.trim().startsWith('+') && digits.length === 10 ? DEFAULT_COUNTRY_CODE + digits : digits;
  return `https://wa.me/${international}`;
}

/** Botón de acciones del perfil (pill grande): primario con el acento, secundario gris. */
export function profileButtonClass(theme: ProfileTheme, kind: 'primary' | 'secondary') {
  const style = THEME_STYLES[theme] ?? THEME_STYLES.DEFAULT;
  return `flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full text-[17px] font-semibold transition-colors ${
    kind === 'primary' ? 'text-white hover:brightness-110' : style.secondaryButton
  }`;
}

export function profileAccent(theme: ProfileTheme) {
  return (THEME_STYLES[theme] ?? THEME_STYLES.DEFAULT).accent;
}

/** Degradado suave tomado del acento y del color secundario del tema. */
function backdropStyle(theme: ThemeStyle, isDark: boolean): CSSProperties {
  const mix = (color: string, pct: number, base = 'transparent') => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  return {
    background: [
      `radial-gradient(48rem 36rem at 0% 0%, ${mix(theme.accent, isDark ? 35 : 38)}, transparent 70%)`,
      `radial-gradient(40rem 32rem at 100% 100%, ${mix(theme.blob, isDark ? 18 : 26)}, transparent 70%)`,
      isDark ? '#0b0b0d' : mix(theme.accent, 10, '#f5f5f7'),
    ].join(', '),
  };
}

interface Props {
  profile: PublicProfile;
  /** Acciones extra (guardar contacto, formulario de contacto…). */
  children?: ReactNode;
  /** En la vista previa del editor no ocupa toda la pantalla. */
  compact?: boolean;
}

/**
 * Tarjeta pública del perfil, al estilo de una ficha de contacto de iOS. Todo se pinta como
 * texto (React escapa), nunca como HTML; los enlaces externos abren sin referrer.
 */
export function PublicProfileCard({ profile, children, compact = false }: Props) {
  const theme = THEME_STYLES[profile.theme] ?? THEME_STYLES.DEFAULT;
  const avatar = safeHref(profile.avatarUrl);
  const cover = safeHref(profile.coverUrl);
  const website = safeHref(profile.website);
  const isDark = profile.theme === 'DARK';
  // Sobre fondo negro el azul de acento no llega a 4.5:1 como texto: se aclara.
  const linkColor = isDark ? '#4da3ff' : theme.accent;
  const websiteHost = website ? new URL(website).hostname.replace(/^www\./, '') : null;

  const quickActions = [
    profile.phone && { href: whatsappHref(profile.phone), label: 'WhatsApp', icon: MessageCircle, external: true },
    profile.phone && { href: telHref(profile.phone), label: 'Llamar', icon: Phone, external: false },
    profile.email && { href: `mailto:${profile.email}`, label: 'Correo', icon: Mail, external: false },
    website && { href: website, label: 'Sitio web', icon: Globe, external: true },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone; external: boolean }[];

  const details = [
    profile.phone && { label: 'WhatsApp', value: profile.phone, href: whatsappHref(profile.phone), external: true },
    profile.email && { label: 'Email', value: profile.email, href: `mailto:${profile.email}`, external: false },
    website && { label: 'Sitio web', value: websiteHost!, href: website, external: true },
  ].filter(Boolean) as { label: string; value: string; href: string; external: boolean }[];

  const links = profile.links
    .map((link) => ({ ...link, href: safeHref(link.url) }))
    .filter((link): link is typeof link & { href: string } => !!link.href);

  return (
    <div className={`${theme.page} ${theme.text} ${compact ? '' : 'relative isolate min-h-screen sm:px-6 sm:py-12'}`}>
      {/* Tablet/PC: fondo degradado con los colores del tema detrás de la tarjeta (en móvil no se muestra). */}
      {!compact && <div className="pointer-events-none fixed inset-0 -z-10 hidden sm:block" style={backdropStyle(theme, isDark)} aria-hidden="true" />}
      <article
        className={`mx-auto flex w-full max-w-md flex-col items-center ${
          compact
            ? 'pb-6'
            : // Tablet/PC: tarjeta flotante con borde y sombra; en móvil ocupa toda la pantalla.
              `pb-10 sm:overflow-hidden sm:rounded-[32px] sm:ring-1 sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] ${theme.page} ${
                isDark ? 'sm:ring-white/15' : 'sm:ring-black/[0.08]'
              }`
        }`}
      >
        <div
          className={`relative h-40 w-full overflow-hidden ${compact ? 'sm:mt-6 sm:rounded-[28px]' : 'sm:h-44'}`}
          style={{ background: theme.accent }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria del usuario
            <img src={cover} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <>
              <span className="absolute -top-20 -right-16 h-64 w-64 rounded-full border-[36px] border-white/[0.12]" aria-hidden="true" />
              <span className="absolute -bottom-28 -left-10 h-52 w-52 rounded-full opacity-90" style={{ background: theme.blob }} aria-hidden="true" />
            </>
          )}
        </div>

        <div className="relative -mt-14 rounded-full bg-white p-[5px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria del usuario
            <img src={avatar} alt={`Foto de ${profile.displayName}`} className="h-[102px] w-[102px] rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className={`flex h-[102px] w-[102px] items-center justify-center rounded-full text-[36px] font-bold tracking-tight ${theme.avatar}`} aria-hidden="true">
              {getInitials(profile.displayName)}
            </div>
          )}
        </div>

        <h1 className="mt-4 px-6 text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em] break-words">{profile.displayName}</h1>
        {profile.headline && <p className={`mt-1.5 px-6 text-center text-base leading-snug ${theme.muted}`}>{profile.headline}</p>}
        {profile.locationLabel && (
          <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${theme.soft}`}>
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {profile.locationLabel}
          </p>
        )}

        {quickActions.length > 0 && (
          <div className="mt-6 flex gap-7">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                {...(action.external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
                className="flex flex-col items-center gap-2 text-xs font-medium"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${theme.group}`} style={{ color: theme.accent }}>
                  <action.icon className="h-[22px] w-[22px]" aria-hidden="true" />
                </span>
                {action.label}
              </a>
            ))}
          </div>
        )}

        {profile.bio && (
          <p className={`mt-6 px-7 text-center text-[15px] leading-relaxed whitespace-pre-line break-words ${compact ? '' : 'opacity-90'}`}>
            {profile.bio}
          </p>
        )}

        {details.length > 0 && (
          <section className="mt-6 w-full px-4" aria-label="Contacto">
            <div className={`overflow-hidden rounded-[20px] ${theme.group}`}>
              {details.map((detail, index) => (
                <a
                  key={detail.label}
                  href={detail.href}
                  {...(detail.external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}
                  className={`flex min-h-[56px] flex-col justify-center px-4 py-2.5 ${index > 0 ? `border-t ${theme.separator}` : ''}`}
                >
                  <span className={`text-[13px] ${theme.muted}`}>{detail.label}</span>
                  <span className="text-base font-medium break-all" style={{ color: linkColor }}>
                    {detail.value}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {links.length > 0 && (
          <section className="mt-6 w-full px-4" aria-label="Enlaces">
            <h2 className="group-label" style={isDark ? { color: '#a1a1a6' } : undefined}>
              Enlaces
            </h2>
            <ul className={`overflow-hidden rounded-[20px] ${theme.group}`}>
              {links.map((link, index) => {
                const { icon: Icon, tile } = LINK_ICONS[link.type] ?? LINK_ICONS.OTHER;
                return (
                  <li key={`${index}-${link.url}`} className={index > 0 ? `border-t ${theme.separator}` : ''}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-[60px] items-center gap-3.5 px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: tile ?? theme.accent }}>
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-base font-semibold">{link.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#aeaeb2]" strokeWidth={2.5} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {children && <div className="mt-6 flex w-full flex-col gap-3 px-4">{children}</div>}

        {!compact && (
          <p className={`mt-8 flex items-center gap-1.5 text-[13px] ${theme.muted}`}>
            Creado con <BrandIcon size="xs" /> <span className="font-bold">NFCya</span>
          </p>
        )}
      </article>
    </div>
  );
}
