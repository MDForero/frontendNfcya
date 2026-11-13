'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Inbox, Link2, QrCode, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { navItemsFor } from '@/lib/navigation';
import { BrandLink } from '@/components/brand/brand-mark';
import ProfileDropdown from './profile-dropdown';

const ICONS: Record<string, typeof House> = {
  '/dashboard': House,
  '/profile': UserRound,
  '/links': Link2,
  '/nfc-qr': QrCode,
  '/leads': Inbox,
  '/admin/profiles': ShieldCheck,
};

/** Etiquetas cortas para la barra inferior del móvil. */
const SHORT: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/profile': 'Perfil',
  '/links': 'Enlaces',
  '/nfc-qr': 'NFC y QR',
  '/leads': 'Contactos',
  '/admin/profiles': 'Admin',
};

/**
 * Escritorio: barra superior translúcida con pestañas en píldora.
 * Móvil: la misma barra (marca + cuenta) y una barra de pestañas inferior, como en iOS.
 */
export default function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading || !isAuthenticated) return null;

  const items = navItemsFor(user?.role);
  const isActive = ({ href, match }: { href: string; match?: string }) => {
    const prefix = match ?? href;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  };

  return (
    <>
      <header className="glass sticky top-0 z-30 border-b border-black/[0.06]">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
          <BrandLink />
          <nav aria-label="Principal" className="hidden min-w-0 flex-1 flex-wrap gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item) ? 'page' : undefined}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  isActive(item)
                    ? 'bg-ink font-semibold text-white'
                    : 'font-medium text-ink-2 hover:bg-black/5 hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto md:ml-0">
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <nav
        aria-label="Secciones"
        className="glass-white fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => {
            const Icon = ICONS[item.href] ?? House;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 text-[10px] ${
                  active ? 'font-bold text-brand' : 'font-semibold text-ink-3'
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 2} aria-hidden="true" />
                {SHORT[item.href] ?? item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
