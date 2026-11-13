import type { Role } from '@/lib/utils/auth-helpers';

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  /** Prefijo que marca la pestaña como activa (por defecto, el propio href). */
  match?: string;
}

const OWNERS: Role[] = ['CLIENTE', 'EMPRESA'];
export const ADMIN_VIEW_ROLES: Role[] = ['SUPER_ADMIN', 'SOPORTE', 'EMPRESA'];
export const ADMIN_MANAGE_ROLES: Role[] = ['SUPER_ADMIN', 'EMPRESA'];

/**
 * Navegación del panel según el rol. Es solo experiencia de usuario: la API vuelve a
 * comprobar el rol en cada petición (403 si no corresponde).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', roles: ['CLIENTE', 'EMPRESA', 'SOPORTE', 'SUPER_ADMIN'] },
  { href: '/profile', label: 'Mi perfil', roles: OWNERS },
  { href: '/links', label: 'Enlaces', roles: OWNERS },
  { href: '/nfc-qr', label: 'NFC y QR', roles: OWNERS },
  { href: '/leads', label: 'Contactos', roles: OWNERS },
  { href: '/admin/profiles', label: 'Administración', roles: ADMIN_VIEW_ROLES, match: '/admin' },
];

export const navItemsFor = (role: Role | undefined) =>
  role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : [];
