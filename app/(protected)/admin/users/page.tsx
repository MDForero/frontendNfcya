'use client';

import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import {
  AdminUser,
  changeUserOrganization,
  changeUserRole,
  createAdminUser,
  CreatableAdminRole,
  deleteAdminUser,
  listAdminUsers,
  listOrganizations,
  Organization,
  reactivateUser,
  resendUserVerification,
  sendUserPasswordReset,
  suspendUser,
  USER_STATUS_LABELS,
  UserStatus,
} from '@/lib/api/admin-users';
import type { Page } from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/contexts/auth-context';
import { formatRole, Role } from '@/lib/utils/auth-helpers';
import { ADMIN_VIEW_ROLES } from '@/lib/navigation';
import { AdminTabs } from '@/components/admin/admin-tabs';
import { PageHeader, PageSpinner } from '@/components/profile/page-states';
import { Pagination } from '@/components/profile/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

const PAGE_SIZE = 20;
const ROLES: Role[] = ['SUPER_ADMIN', 'SOPORTE', 'EMPRESA', 'CLIENTE'];
const SELECT_CLASS = 'h-11 rounded-xl border-0 bg-white px-3 text-base';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const allowed = !!user && ADMIN_VIEW_ROLES.includes(user.role);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    listAdminUsers({ page, pageSize: PAGE_SIZE, role, status, search })
      .then((result) => {
        if (cancelled) return;
        setError(null);
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(apiErrorMessage(err, 'No se pudieron cargar los usuarios.'));
        setData({ items: [], total: 0, page, pageSize: PAGE_SIZE });
      });
    return () => {
      cancelled = true;
    };
  }, [allowed, page, role, status, search, reload]);

  // Solo SUPER_ADMIN asigna organizaciones.
  useEffect(() => {
    if (!isSuperAdmin) return;
    listOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]));
  }, [isSuperAdmin]);

  if (!allowed) {
    return (
      <>
        <PageHeader title="Administración de usuarios" />
        <Alert variant="destructive">No tienes permisos para ver esta sección.</Alert>
      </>
    );
  }

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const replaceUser = (updated: AdminUser) =>
    setData((prev) => prev && { ...prev, items: prev.items.map((u) => (u.id === updated.id ? updated : u)) });

  const removeUser = (id: string) => {
    setOpenId(null);
    setData((prev) => prev && { ...prev, total: prev.total - 1, items: prev.items.filter((u) => u.id !== id) });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <AdminTabs active="/admin/users" />
      <PageHeader
        title="Administración de usuarios"
        description={
          user?.role === 'EMPRESA'
            ? 'Clientes de tu organización.'
            : 'Todas las cuentas de la plataforma. Los cambios quedan auditados.'
        }
        actions={
          isSuperAdmin && (
            <Button onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate}>
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Nuevo administrador
            </Button>
          )
        }
      />

      {isSuperAdmin && showCreate && (
        <CreateAdminForm
          onCancel={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false);
            toast.success(`Invitación enviada a ${created.email}.`);
            setPage(1);
            setReload((n) => n + 1);
          }}
        />
      )}

      <form onSubmit={applySearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-ink-3" aria-hidden="true" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o email"
            className="bg-white pl-10"
            aria-label="Buscar usuarios"
          />
        </div>
        {user?.role !== 'EMPRESA' && (
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value as Role | '');
            }}
            className={SELECT_CLASS}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {formatRole(value)}
              </option>
            ))}
          </select>
        )}
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as UserStatus | '');
          }}
          className={SELECT_CLASS}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(USER_STATUS_LABELS) as UserStatus[]).map((value) => (
            <option key={value} value={value}>
              {USER_STATUS_LABELS[value]}
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
          <div className="p-5 text-sm text-ink-3">No hay usuarios que coincidan.</div>
        </div>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-3">{data.total} usuario(s)</p>
          <div className="overflow-hidden rounded-[20px] bg-white">
            <table className="w-full text-sm">
              <thead className="hidden border-b border-separator text-left text-[13px] tracking-[0.04em] text-ink-3 uppercase md:table-header-group">
                <tr>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Rol</th>
                  <th className="px-4 py-2 font-medium">Organización</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Creado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
                {data.items.map((row) => {
                  const isSelf = row.id === user?.id;
                  const open = openId === row.id;
                  return [
                    <tr key={row.id} className="flex flex-col gap-1 p-4 md:table-row md:p-0">
                      <td className="md:px-4 md:py-3">
                        <div className="font-semibold text-ink">
                          {row.name} {isSelf && <Badge variant="info">Tú</Badge>}
                        </div>
                        <div className="break-all text-ink-2">{row.email}</div>
                        {!row.emailVerified && (
                          <div className="text-xs text-ink-3">
                            {row.providers.length === 0 ? 'Invitación pendiente' : 'Correo sin verificar'}
                          </div>
                        )}
                      </td>
                      <td className="md:px-4 md:py-3">
                        <Badge variant={row.role === 'SUPER_ADMIN' || row.role === 'SOPORTE' ? 'info' : 'secondary'}>
                          {formatRole(row.role)}
                        </Badge>
                      </td>
                      <td className="text-ink-2 md:px-4 md:py-3">{row.organization?.name ?? '—'}</td>
                      <td className="md:px-4 md:py-3">
                        <Badge variant={row.status === 'ACTIVA' ? 'success' : 'destructive'}>
                          {USER_STATUS_LABELS[row.status]}
                        </Badge>
                      </td>
                      <td className="text-xs text-ink-3 md:px-4 md:py-3">
                        {new Date(row.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td className="md:px-4 md:py-3">
                        {!isSelf && (
                          <div className="flex md:justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              aria-expanded={open}
                              onClick={() => setOpenId(open ? null : row.id)}
                            >
                              {open ? 'Cerrar' : 'Gestionar'}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>,
                    open && (
                      <tr key={`${row.id}-panel`} className="block bg-fill/40 md:table-row">
                        <td colSpan={6} className="block p-4 md:table-cell">
                          <ManagePanel
                            target={row}
                            actorRole={user!.role}
                            organizations={organizations}
                            onUpdated={replaceUser}
                            onDeleted={removeUser}
                          />
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}

/** Alta de SUPER_ADMIN o SOPORTE: la cuenta recibe un correo para definir su contraseña. */
function CreateAdminForm({
  onCreated,
  onCancel,
}: {
  onCreated: (user: AdminUser) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CreatableAdminRole>('SUPER_ADMIN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCreated(await createAdminUser({ name: name.trim(), email: email.trim(), role }));
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo crear el administrador.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-[20px] bg-white p-5" aria-label="Nuevo administrador">
      <h2 className="text-lg font-semibold text-ink">Nuevo administrador</h2>
      <p className="mt-1 mb-4 text-sm text-ink-3">
        Le llegará un correo para definir su propia contraseña (el enlace vence en 72 horas). Tú nunca conoces su
        clave.
      </p>
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="admin-name">Nombre</Label>
          <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-role">Rol</Label>
          <select
            id="admin-role"
            value={role}
            onChange={(e) => setRole(e.target.value as CreatableAdminRole)}
            className="h-11 rounded-xl border-0 bg-fill px-3 text-base"
          >
            <option value="SUPER_ADMIN">Super Admin (control total)</option>
            <option value="SOPORTE">Soporte (consulta y asistencia)</option>
          </select>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? 'Creando…' : 'Crear y enviar invitación'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** Acciones sobre un usuario según el rol de quien administra. La API vuelve a validar todo. */
function ManagePanel({
  target,
  actorRole,
  organizations,
  onUpdated,
  onDeleted,
}: {
  target: AdminUser;
  actorRole: Role;
  organizations: Organization[];
  onUpdated: (user: AdminUser) => void;
  onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const isSuperAdmin = actorRole === 'SUPER_ADMIN';
  const canAssist = isSuperAdmin || actorRole === 'SOPORTE';
  const canChangeStatus = isSuperAdmin || actorRole === 'EMPRESA';

  const [role, setRole] = useState<Role>(target.role);
  const [organizationId, setOrganizationId] = useState(target.organization?.id ?? '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<void>, failMessage: string) => {
    setBusy(key);
    try {
      await action();
    } catch (err) {
      toast.error(apiErrorMessage(err, failMessage));
    } finally {
      setBusy(null);
    }
  };

  const saveRole = () =>
    run(
      'role',
      async () => {
        onUpdated(await changeUserRole(target.id, role));
        toast.success(`Rol de ${target.email} cambiado a ${formatRole(role)}.`);
      },
      'No se pudo cambiar el rol.',
    );

  const saveOrganization = () =>
    run(
      'org',
      async () => {
        onUpdated(await changeUserOrganization(target.id, organizationId || null));
        toast.success('Organización actualizada.');
      },
      'No se pudo cambiar la organización.',
    );

  const toggleStatus = () => {
    const suspending = target.status === 'ACTIVA';
    const question = suspending
      ? `¿Suspender la cuenta de ${target.email}? Se cerrarán sus sesiones y no podrá entrar.`
      : `¿Reactivar la cuenta de ${target.email}?`;
    if (!window.confirm(question)) return;
    return run(
      'status',
      async () => {
        onUpdated(suspending ? await suspendUser(target.id) : await reactivateUser(target.id));
        toast.success(suspending ? 'Cuenta suspendida.' : 'Cuenta reactivada.');
      },
      'No se pudo cambiar el estado.',
    );
  };

  const remove = () =>
    run(
      'delete',
      async () => {
        await deleteAdminUser(target.id);
        onDeleted(target.id);
        toast.success(`Usuario ${target.email} eliminado.`);
      },
      'No se pudo eliminar el usuario.',
    );

  const roleOrOrgDirty = role !== target.role || organizationId !== (target.organization?.id ?? '');

  return (
    <div className="grid gap-5">
      {isSuperAdmin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`role-${target.id}`}>Rol</Label>
            <div className="flex gap-2">
              <select
                id={`role-${target.id}`}
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={`${SELECT_CLASS} flex-1`}
              >
                {ROLES.map((value) => (
                  <option key={value} value={value}>
                    {formatRole(value)}
                  </option>
                ))}
              </select>
              <Button className="h-11" disabled={role === target.role || busy !== null} onClick={saveRole}>
                Guardar
              </Button>
            </div>
            {role === 'EMPRESA' && !target.organization && (
              <p className="text-xs text-ink-3">Asigna primero una organización para poder darle el rol Empresa.</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`org-${target.id}`}>Organización</Label>
            <div className="flex gap-2">
              <select
                id={`org-${target.id}`}
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className={`${SELECT_CLASS} flex-1`}
              >
                <option value="">Sin organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              <Button
                className="h-11"
                disabled={organizationId === (target.organization?.id ?? '') || busy !== null}
                onClick={saveOrganization}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canChangeStatus && (
          <Button
            size="sm"
            variant={target.status === 'ACTIVA' ? 'destructive' : 'secondary'}
            disabled={busy !== null}
            onClick={toggleStatus}
          >
            {target.status === 'ACTIVA' ? 'Suspender cuenta' : 'Reactivar cuenta'}
          </Button>
        )}
        {canAssist && !target.emailVerified && target.providers.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() =>
              run(
                'verify',
                async () => {
                  await resendUserVerification(target.id);
                  toast.success('Correo de verificación reenviado.');
                },
                'No se pudo reenviar la verificación.',
              )
            }
          >
            Reenviar verificación
          </Button>
        )}
        {canAssist && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() =>
              run(
                'reset',
                async () => {
                  await sendUserPasswordReset(target.id);
                  toast.success('Enlace para definir la contraseña enviado (vence en 1 hora).');
                },
                'No se pudo enviar el enlace.',
              )
            }
          >
            {target.providers.length === 0 ? 'Reenviar enlace de contraseña' : 'Enviar enlace de contraseña'}
          </Button>
        )}
      </div>
      {roleOrOrgDirty && <p className="-mt-3 text-xs text-ink-3">Hay cambios sin guardar.</p>}

      {isSuperAdmin && (
        <div className="rounded-2xl border border-danger/30 p-4">
          <h3 className="font-semibold text-danger">Eliminar usuario</h3>
          <p className="mt-1 mb-3 text-sm text-ink-2">
            Borra definitivamente la cuenta junto con su perfil, enlaces, códigos NFC/QR y contactos recibidos. No se
            puede deshacer; si solo quieres bloquear el acceso, suspende la cuenta. Queda registrado en la auditoría.
          </p>
          <Label htmlFor={`confirm-${target.id}`} className="mb-2">
            Escribe <span className="font-mono">{target.email}</span> para confirmar
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`confirm-${target.id}`}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              className="bg-white sm:max-w-sm"
            />
            <Button
              variant="destructive"
              className="h-11"
              disabled={confirmEmail.trim().toLowerCase() !== target.email || busy !== null}
              onClick={remove}
            >
              {busy === 'delete' ? 'Eliminando…' : 'Eliminar definitivamente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
