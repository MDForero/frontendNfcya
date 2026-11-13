import { CircleAlert } from 'lucide-react';

export function PublicSpinner({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
      <div className="flex flex-col items-center gap-3 text-ink-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-fill-2 border-t-brand" aria-hidden="true" />
        <p className="text-sm">{label}</p>
      </div>
    </main>
  );
}

export function PublicMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-[28px] bg-white p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft text-orange-ink">
          <CircleAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{description}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-6 h-11 rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-strong"
          >
            {action.label}
          </button>
        )}
      </div>
    </main>
  );
}
