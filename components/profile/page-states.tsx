import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { MyProfileState } from '@/hooks/use-my-profile';

export function PageSpinner() {
  return (
    <div className="flex min-h-[300px] items-center justify-center" aria-busy="true">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-fill-2 border-t-brand" aria-hidden="true" />
    </div>
  );
}

/** Estados comunes de las páginas que dependen del perfil propio. Devuelve null si está listo. */
export function ProfileGate({ state, onRetry }: { state: MyProfileState; onRetry: () => void }) {
  switch (state.status) {
    case 'loading':
      return <PageSpinner />;
    case 'forbidden':
      return <Alert>Tu rol no tiene perfil digital propio. Usa la sección de administración.</Alert>;
    case 'missing':
      return (
        <Alert>
          Aún no tienes perfil digital.{' '}
          <Link href="/profile" className="font-medium underline">
            Créalo aquí
          </Link>
          .
        </Alert>
      );
    case 'error':
      return (
        <Alert variant="destructive">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{state.message}</span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        </Alert>
      );
    default:
      return null;
  }
}

/** Título grande al estilo iOS, con acciones opcionales a la derecha (debajo en móvil). */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="large-title text-[34px] text-ink sm:text-[44px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[17px] leading-snug text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Lista agrupada (Settings de iOS): título opcional + tarjeta blanca con separadores. */
export function GroupedList({
  title,
  footer,
  children,
  className = '',
}: {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title && <h2 className="group-label">{title}</h2>}
      <div className="divide-y divide-separator overflow-hidden rounded-[20px] bg-white">{children}</div>
      {footer && <p className="mt-2 px-4 text-[13px] leading-snug text-ink-3">{footer}</p>}
    </section>
  );
}
