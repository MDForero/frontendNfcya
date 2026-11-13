'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Ban, Download, Nfc, Plus, QrCode } from 'lucide-react';
import {
  createIdentifier,
  Identifier,
  IdentifierKind,
  IdentifierStatus,
  listIdentifiers,
  setIdentifierStatus,
} from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { useMyProfile } from '@/hooks/use-my-profile';
import { PageHeader, PageSpinner, ProfileGate } from '@/components/profile/page-states';
import { CopyButton } from '@/components/profile/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

const STATUS: Record<IdentifierStatus, { label: string; variant: 'success' | 'secondary' | 'destructive'; dot: string }> = {
  ACTIVE: { label: 'Activo', variant: 'success', dot: 'bg-success' },
  INACTIVE: { label: 'Desactivado', variant: 'secondary', dot: 'bg-[#8e8e93]' },
  REVOKED: { label: 'Revocado', variant: 'destructive', dot: 'bg-danger' },
};

function QrImage({ url, name }: { url: string; name: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: 'M' })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url]);

  if (!dataUrl) return <div className="h-28 w-28 animate-pulse rounded-2xl bg-fill" aria-hidden="true" />;
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada en el navegador */}
      <img src={dataUrl} alt={`Código QR que abre ${url}`} className="h-28 w-28 rounded-2xl bg-fill p-1.5" />
      <a
        href={dataUrl}
        download={`nfcya-${name}.png`}
        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" /> Descargar PNG
      </a>
    </div>
  );
}

export default function NfcQrPage() {
  const { state, reload } = useMyProfile();
  const [items, setItems] = useState<Identifier[] | null>(null);
  const [kind, setKind] = useState<IdentifierKind>('QR');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [filter, setFilter] = useState<'ALL' | IdentifierKind>('ALL');

  const ready = state.status === 'ready';

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    listIdentifiers()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiErrorMessage(err, 'No se pudieron cargar tus códigos.'));
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (state.status !== 'ready') {
    return (
      <>
        <PageHeader title="NFC y QR" />
        <ProfileGate state={state} onRetry={reload} />
      </>
    );
  }

  const run = async (action: () => Promise<void>, fallback: string, success: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      toast.error(apiErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const created = await createIdentifier(kind, label.trim());
      setItems((prev) => [created, ...(prev ?? [])]);
      setLabel('');
    }, 'No se pudo crear el código.', kind === 'QR' ? 'Código QR creado.' : 'Etiqueta NFC creada.');
  };

  const changeStatus = (item: Identifier, status: IdentifierStatus) => {
    if (
      status === 'REVOKED' &&
      !window.confirm('Revocar es definitivo: el chip o QR dejará de funcionar para siempre. ¿Continuar?')
    )
      return;
    run(async () => {
      const updated = await setIdentifierStatus(item.id, status);
      setItems((prev) => (prev ?? []).map((i) => (i.id === item.id ? updated : i)));
    }, 'No se pudo cambiar el estado.', STATUS_TOAST[status]);
  };

  const published = state.profile.status === 'PUBLISHED';
  const visible = (items ?? []).filter((item) => filter === 'ALL' || item.kind === filter);

  return (
    <>
      <PageHeader title="NFC y QR" description="Cada código abre tu perfil publicado. Si pierdes una tarjeta, desactívala o revócala." />

      {!published && (
        <Alert className="mb-6">Tu perfil no está publicado: los códigos mostrarán «no disponible» hasta que lo publiques.</Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="flex flex-wrap items-start gap-7">
        <div className="min-w-0 flex-[999_1_480px] space-y-4">
          <div role="group" aria-label="Filtrar códigos" className="grid max-w-sm grid-cols-3 rounded-xl bg-[#e3e3e8] p-[3px]">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={`h-9 rounded-[9px] text-sm transition-colors ${
                  filter === option.value ? 'bg-white font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'font-medium text-ink-2'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {items === null ? (
            <PageSpinner />
          ) : visible.length === 0 ? (
            <div className="rounded-[24px] bg-white px-5 py-8 text-center text-[15px] text-ink-3">
              {items.length === 0 ? 'Aún no tienes códigos. Crea uno para tu tarjeta NFC o para imprimir un QR.' : 'No hay códigos de este tipo.'}
            </div>
          ) : (
            visible.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-[24px] bg-white p-5">
                <div className="flex flex-wrap items-center gap-4">
                  {item.status !== 'REVOKED' ? (
                    <QrImage url={item.url} name={item.code} />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fill text-ink-3" aria-hidden="true">
                      <Ban className="h-7 w-7" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      {item.kind === 'NFC' ? (
                        <Nfc className="h-[18px] w-[18px] text-orange-ink" aria-hidden="true" />
                      ) : (
                        <QrCode className="h-[18px] w-[18px] text-ink-2" aria-hidden="true" />
                      )}
                      <span className="text-[17px] font-bold">{item.label || (item.kind === 'NFC' ? 'Chip NFC' : 'Código QR')}</span>
                    </div>
                    <Badge variant={STATUS[item.status].variant}>
                      <span className={`h-[7px] w-[7px] rounded-full ${STATUS[item.status].dot}`} aria-hidden="true" />
                      {STATUS[item.status].label}
                    </Badge>
                    <p className="font-mono text-[13px] break-all text-ink-3">{item.url}</p>
                    <p className="text-xs text-ink-3">Creado el {new Date(item.createdAt).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
                {item.status !== 'REVOKED' && (
                  <>
                    <div className="flex flex-wrap gap-2.5">
                      <CopyButton value={item.url} label="Copiar URL" />
                      {item.status === 'ACTIVE' ? (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => changeStatus(item, 'INACTIVE')}>
                          Desactivar
                        </Button>
                      ) : (
                        <Button size="sm" disabled={busy} onClick={() => changeStatus(item, 'ACTIVE')}>
                          Activar
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => changeStatus(item, 'REVOKED')}>
                        Revocar
                      </Button>
                    </div>
                    {item.status === 'INACTIVE' && (
                      <p className="text-sm leading-snug text-ink-2">Mientras no esté activo, al abrirlo se verá «Código no disponible».</p>
                    )}
                  </>
                )}
              </article>
            ))
          )}
        </div>

        <div className="w-full flex-[1_1_320px] space-y-6 lg:sticky lg:top-24">
          <section>
            <h2 className="group-label">Nuevo código</h2>
            <form onSubmit={create} className="space-y-4 rounded-[20px] bg-white p-5">
              <fieldset className="grid grid-cols-2 gap-2.5">
                <legend className="sr-only">Tipo</legend>
                {(['QR', 'NFC'] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                      kind === value ? 'bg-ink text-white' : 'bg-fill text-ink-2 hover:bg-fill-2'
                    }`}
                  >
                    <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
                    {value === 'QR' ? <QrCode className="h-4 w-4" aria-hidden="true" /> : <Nfc className="h-4 w-4" aria-hidden="true" />}
                    {value === 'QR' ? 'QR' : 'Chip NFC'}
                  </label>
                ))}
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="identifier-label">Nombre (opcional)</Label>
                <Input id="identifier-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Tarjeta principal" />
              </div>
              <Button type="submit" className="h-11 w-full" disabled={busy}>
                <Plus aria-hidden="true" /> Crear código
              </Button>
            </form>
          </section>

          <section>
            <h2 className="group-label">Cómo grabar el chip NFC</h2>
            <div className="rounded-[20px] bg-white p-5">
              <ol className="space-y-3 text-[15px] leading-snug text-ink-2">
                {NFC_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-extrabold text-ink" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[13px] leading-snug text-ink-3">
                El chip guarda solo la URL, ningún dato personal. No lo bloquees contra escritura si piensas reutilizarlo.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const STATUS_TOAST: Record<IdentifierStatus, string> = {
  ACTIVE: 'Código activado.',
  INACTIVE: 'Código desactivado.',
  REVOKED: 'Código revocado definitivamente.',
};

const FILTERS: { value: 'ALL' | IdentifierKind; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'NFC', label: 'NFC' },
  { value: 'QR', label: 'QR' },
];

const NFC_STEPS = [
  'Instala una app de escritura NFC (por ejemplo, «NFC Tools»).',
  'Elige Escribir → Agregar registro → URL/URI.',
  'Pega la URL del código (botón «Copiar URL»). Debe empezar por https://.',
  'Acerca el chip al teléfono y confirma la escritura.',
  'Prueba con otro teléfono: debe abrir tu perfil.',
];
