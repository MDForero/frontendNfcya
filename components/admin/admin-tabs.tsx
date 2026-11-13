import Link from 'next/link';

const TABS = [
  { href: '/admin/profiles', label: 'Perfiles' },
  { href: '/admin/users', label: 'Usuarios' },
] as const;

/** Pestañas de la sección de administración. La página activa se pasa explícitamente. */
export function AdminTabs({ active }: { active: (typeof TABS)[number]['href'] }) {
  return (
    <nav aria-label="Administración" className="mb-6 inline-flex rounded-full bg-fill p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === active ? 'page' : undefined}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            tab.href === active ? 'bg-white font-semibold text-ink shadow-sm' : 'font-medium text-ink-2 hover:text-ink'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
