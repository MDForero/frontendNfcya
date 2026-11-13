'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import {
  AdminProfile,
  listAdminProfiles,
  Page,
  ProfileStatus,
  reactivateProfile,
  STATUS_LABELS,
  suspendProfile,
} from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import { formatRole } from '@/lib/utils/auth-helpers';
import { ADMIN_MANAGE_ROLES, ADMIN_VIEW_ROLES } from '@/lib/navigation';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { PageHeader, PageSpinner } from '@/components/profile/page-states';
import { Pagination } from '@/components/profile/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 20;

const statusVariant = (status: ProfileStatus) =>
  status === 'PUBLISHED' ? 'success' : status === 'SUSPENDED' ? 'destructive' : 'secondary';

export default function AdminProfilesPage() {
  const { user } = useAuth();
  const allowed = !!user && ADMIN_VIEW_ROLES.includes(user.role);
  const canManage = !!user && ADMIN_MANAGE_ROLES.includes(user.role);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProfileStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Page<AdminProfile> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listAdminProfiles({ page, pageSize: PAGE_SIZE, status, search })
      .then((result) => {
        if (cancelled) return;
        setError(null);
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiErrorMessage(err, 'No se pudieron cargar los perfiles.'));
        setData({ items: [], total: 0, page, pageSize: PAGE_SIZE });
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, page, status, search]);

  if (!allowed) {
    return (
      <>
        <PageHeader title="Administración de perfiles" />
        <Alert variant="destructive">No tienes permisos para ver esta sección.</Alert>
      </>
    );
  }

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const changeStatus = async (profile: AdminProfile) => {
    const suspending = profile.status !== 'SUSPENDED';
    const question = suspending
      ? `¿Suspender el perfil “${profile.displayName}”? Dejará de ser visible y su propietario no podrá publicarlo.`
      : `¿Reactivar el perfil “${profile.displayName}”? Quedará en borrador hasta que su propietario lo publique.`;
    if (!window.confirm(question)) return;
    setBusyId(profile.id);
    try {
      const updated = suspending ? await suspendProfile(profile.id) : await reactivateProfile(profile.id);
      setData((prev) => prev && { ...prev, items: prev.items.map((p) => (p.id === updated.id ? updated : p)) });
      toast.success(suspending ? `Perfil «${profile.displayName}» suspendido.` : `Perfil «${profile.displayName}» reactivado.`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo cambiar el estado.'));
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <AdminTabs active="/admin/profiles" />
      <PageHeader
        title="Administración de perfiles"
        description={
          user?.role === 'EMPRESA'
            ? 'Perfiles de los clientes de tu organización.'
            : 'Todos los perfiles de la plataforma. Las suspensiones quedan auditadas.'
        }
      />

      <form onSubmit={applySearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-ink-3" aria-hidden="true" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por slug, nombre o email del propietario"
            className="bg-white pl-10"
            aria-label="Buscar perfiles"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as ProfileStatus | '');
          }}
          className="h-11 rounded-xl border-0 bg-white px-3 text-base"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_LABELS) as ProfileStatus[]).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-11 px-5">
          Buscar
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      {!data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <div className="rounded-[20px] bg-white">
          <div className="p-5 text-sm text-ink-3">No hay perfiles que coincidan.</div>
        </div>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-3">{data.total} perfil(es)</p>
          {/* Tabla en escritorio, tarjetas apiladas en móvil */}
          <div className="overflow-hidden rounded-[20px] bg-white">
            <table className="w-full text-sm">
              <thead className="hidden border-b border-separator text-left text-[13px] tracking-[0.04em] text-ink-3 uppercase md:table-header-group">
                <tr>
                  <th className="px-4 py-2 font-medium">Perfil</th>
                  <th className="px-4 py-2 font-medium">Propietario</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Creado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {data.items.map((profile) => (
                  <tr key={profile.id} className="flex flex-col gap-1 p-4 md:table-row md:p-0">
                    <td className="md:px-4 md:py-3">
                      <div className="font-semibold text-ink">{profile.displayName}</div>
                      <div className="font-mono text-xs text-ink-3">/{profile.slug}</div>
                    </td>
                    <td className="md:px-4 md:py-3">
                      <div className="break-all">{profile.owner.email}</div>
                      <div className="text-xs text-ink-3">
                        {profile.owner.name} · {formatRole(profile.owner.role as Parameters<typeof formatRole>[0])}
                      </div>
                    </td>
                    <td className="md:px-4 md:py-3">
                      <Badge variant={statusVariant(profile.status)}>{STATUS_LABELS[profile.status]}</Badge>
                    </td>
                    <td className="text-xs text-ink-3 md:px-4 md:py-3">{new Date(profile.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="md:px-4 md:py-3">
                      <div className="flex gap-2 md:justify-end">
                        {profile.status === 'PUBLISHED' && (
                          <a
                            href={`/p/${profile.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-soft px-3.5 text-sm font-semibold text-brand-strong hover:bg-[#dbe9fc]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Ver
                          </a>
                        )}
                        {canManage && (
                          <Button
                            size="sm"
                            variant={profile.status === 'SUSPENDED' ? 'secondary' : 'destructive'}
                            disabled={busyId === profile.id}
                            onClick={() => changeStatus(profile)}
                          >
                            {profile.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
