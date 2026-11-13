'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { deleteMyLead, Lead, listMyLeads, Page } from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { useMyProfile } from '@/hooks/use-my-profile';
import { PageHeader, PageSpinner, ProfileGate } from '@/components/profile/page-states';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/profile/pagination';

const PAGE_SIZE = 20;
const SOURCE_LABELS = { PROFILE: 'Perfil', NFC: 'NFC', QR: 'QR' } as const;

export default function LeadsPage() {
  const { state, reload } = useMyProfile();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Lead> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [version, setVersion] = useState(0);
  const ready = state.status === 'ready';

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    listMyLeads(page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'No se pudieron cargar los contactos.'));
      });
    return () => {
      cancelled = true;
    };
  }, [ready, page, version]);

  if (state.status !== 'ready') {
    return (
      <>
        <PageHeader title="Contactos recibidos" />
        <ProfileGate state={state} onRetry={reload} />
      </>
    );
  }

  const remove = async (lead: Lead) => {
    if (!window.confirm(`¿Eliminar los datos de ${lead.name}? No se pueden recuperar.`)) return;
    try {
      await deleteMyLead(lead.id);
      setVersion((v) => v + 1);
      toast.success('Contacto eliminado.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo eliminar el contacto.'));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Contactos recibidos"
        description="Personas que te dejaron sus datos desde tu perfil, aceptando el tratamiento. Úsalos solo para contactarlas."
      />

      {!state.profile.leadsEnabled && (
        <Alert className="mb-6">
          El formulario de contacto está desactivado. Actívalo en{' '}
          <Link href="/profile" className="font-medium underline">
            Mi perfil
          </Link>
          .
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {!data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <div className="rounded-[20px] bg-white">
          <div className="p-5 text-sm text-ink-3">Aún no has recibido contactos.</div>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((lead) => (
              <li key={lead.id}>
                <div className="rounded-[20px] bg-white">
                  <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[17px] font-bold">{lead.name}</span>
                        <Badge variant="info">{SOURCE_LABELS[lead.source]}</Badge>
                        <span className="text-xs text-ink-3">{new Date(lead.createdAt).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-sm">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} className="break-all font-medium text-brand hover:underline">
                            {lead.email}
                          </a>
                        )}
                        {lead.phone && (
                          <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`} className="font-medium text-brand hover:underline">
                            {lead.phone}
                          </a>
                        )}
                      </div>
                      {lead.message && <p className="text-sm whitespace-pre-line break-words text-ink-2">{lead.message}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => remove(lead)} aria-label={`Eliminar contacto de ${lead.name}`}>
                      <Trash2 className="text-danger" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
