'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Link2,
  MessageCircle,
  Music2,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import {
  createLink,
  deleteLink,
  LINK_TYPES,
  LinkInput,
  LinkType,
  ProfileLink,
  reorderLinks,
  updateLink,
} from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { useMyProfile } from '@/hooks/use-my-profile';
import { PageHeader, ProfileGate } from '@/components/profile/page-states';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';

const MAX_LINKS = 20;
const EMPTY: LinkInput = { label: '', url: '', type: 'WEBSITE' };
const typeLabel = (type: LinkType) => LINK_TYPES.find((t) => t.value === type)?.label ?? type;

/** Ayuda a completar URLs comunes: "wa.me/57…" → "https://wa.me/57…". */
function normalizeUrl(url: string) {
  const value = url.trim();
  if (!value || /^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

export default function LinksPage() {
  const { state, reload, setProfile } = useMyProfile();
  const [form, setForm] = useState<LinkInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (state.status !== 'ready') {
    return (
      <>
        <PageHeader title="Enlaces" />
        <ProfileGate state={state} onRetry={reload} />
      </>
    );
  }

  const { profile } = state;
  const links = [...profile.links].sort((a, b) => a.sortOrder - b.sortOrder);
  const setLinks = (next: ProfileLink[]) => setProfile({ ...profile, links: next });

  const run = async (action: () => Promise<void>, fallback: string, success?: string) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
    } catch (err) {
      toast.error(apiErrorMessage(err, fallback));
      await reload(); // vuelve al estado real del servidor
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.url.trim()) return toast.error('Escribe una etiqueta y una URL.');
    const data = { ...form, label: form.label.trim(), url: normalizeUrl(form.url) };
    run(async () => {
      if (editingId) {
        const updated = await updateLink(editingId, data);
        setLinks(links.map((link) => (link.id === editingId ? updated : link)));
      } else {
        setLinks([...links, await createLink(data)]);
      }
      setForm(EMPTY);
      setEditingId(null);
    }, 'No se pudo guardar el enlace.', editingId ? 'Enlace actualizado.' : 'Enlace añadido.');
  };

  const edit = (link: ProfileLink) => {
    setEditingId(link.id);
    setForm({ label: link.label, url: link.url, type: link.type });
  };

  const toggle = (link: ProfileLink) =>
    run(async () => {
      const updated = await updateLink(link.id, { isActive: !link.isActive });
      setLinks(links.map((l) => (l.id === link.id ? updated : l)));
    }, 'No se pudo cambiar la visibilidad.', link.isActive ? 'Enlace oculto del perfil.' : 'Enlace visible en el perfil.');

  const remove = (link: ProfileLink) => {
    if (!window.confirm(`¿Eliminar el enlace “${link.label}”? Esta acción no se puede deshacer.`)) return;
    run(async () => {
      await deleteLink(link.id);
      setLinks(links.filter((l) => l.id !== link.id));
      if (editingId === link.id) {
        setEditingId(null);
        setForm(EMPTY);
      }
    }, 'No se pudo eliminar el enlace.', 'Enlace eliminado.');
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    setLinks(next.map((link, i) => ({ ...link, sortOrder: i }))); // optimista
    run(async () => setLinks(await reorderLinks(next.map((link) => link.id))), 'No se pudo reordenar.', 'Orden actualizado.');
  };

  return (
    <>
      <PageHeader title="Enlaces" description="Redes, web, WhatsApp… En tu perfil solo aparecen los visibles, en este orden." />


      <div className="flex flex-wrap items-start gap-7">
        <section className="min-w-0 flex-[999_1_480px]">
          <h2 className="group-label">
            Tus enlaces · {links.length}/{MAX_LINKS}
          </h2>
          {links.length === 0 ? (
            <div className="rounded-[20px] bg-white px-5 py-8 text-center text-[15px] text-ink-3">
              Aún no tienes enlaces. Agrega el primero con el formulario.
            </div>
          ) : (
            <ol className="divide-y divide-separator overflow-hidden rounded-[20px] bg-white">
              {links.map((link, index) => {
                const tile = TYPE_TILES[link.type] ?? TYPE_TILES.OTHER;
                return (
                  <li
                    key={link.id}
                    className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-3 ${editingId === link.id ? 'bg-brand-soft/60' : ''}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white ${link.isActive ? '' : 'opacity-40'}`}
                      style={{ background: tile.color }}
                      aria-hidden="true"
                    >
                      <tile.icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-[1_1_160px]">
                      <div className="flex items-center gap-2">
                        <span className={`truncate text-base font-semibold ${link.isActive ? 'text-ink' : 'text-ink-3'}`}>{link.label}</span>
                        <Badge variant="secondary">{typeLabel(link.type)}</Badge>
                        {!link.isActive && <Badge variant="outline">Oculto</Badge>}
                      </div>
                      <p className="truncate text-sm text-ink-3">{link.url}</p>
                    </div>
                    <div className="ml-auto flex shrink-0 gap-0.5">
                      <Button size="icon-sm" variant="ghost" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Subir ${link.label}`}>
                        <ArrowUp />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => move(index, 1)}
                        disabled={busy || index === links.length - 1}
                        aria-label={`Bajar ${link.label}`}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => toggle(link)}
                        disabled={busy}
                        aria-label={link.isActive ? `Ocultar ${link.label}` : `Mostrar ${link.label}`}
                      >
                        {link.isActive ? <Eye /> : <EyeOff />}
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => edit(link)} disabled={busy} aria-label={`Editar ${link.label}`}>
                        <Pencil />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => remove(link)} disabled={busy} aria-label={`Eliminar ${link.label}`}>
                        <Trash2 className="text-danger" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="w-full flex-[1_1_320px] lg:sticky lg:top-24">
          <h2 className="group-label">{editingId ? 'Editar enlace' : 'Nuevo enlace'}</h2>
          <form onSubmit={submit} className="space-y-4 rounded-[20px] bg-white p-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="link-type">Tipo</Label>
              <select
                id="link-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as LinkType })}
                className="h-11 w-full rounded-xl border border-transparent bg-fill px-3 text-base outline-none focus-visible:border-primary focus-visible:bg-white"
              >
                {LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-label">Etiqueta</Label>
              <Input
                id="link-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                maxLength={60}
                placeholder="Mi Instagram"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                maxLength={2048}
                placeholder="https://instagram.com/usuario"
                inputMode="url"
              />
              <p className="pl-1 text-xs leading-snug text-ink-3">Se admiten https://, mailto: y tel:. WhatsApp: https://wa.me/57300…</p>
            </div>
            <div className="flex gap-2.5">
              <Button type="submit" className="h-11 flex-1" disabled={busy || (!editingId && links.length >= MAX_LINKS)}>
                {editingId ? (
                  'Guardar'
                ) : (
                  <>
                    <Plus aria-hidden="true" /> Agregar
                  </>
                )}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

const TYPE_TILES: Record<LinkType, { icon: typeof Globe; color: string }> = {
  WEBSITE: { icon: Globe, color: '#0071e3' },
  INSTAGRAM: { icon: Camera, color: '#c13584' },
  FACEBOOK: { icon: Users, color: '#1877f2' },
  LINKEDIN: { icon: Briefcase, color: '#0a66c2' },
  WHATSAPP: { icon: MessageCircle, color: '#1e8e3e' },
  YOUTUBE: { icon: PlayCircle, color: '#d70015' },
  TIKTOK: { icon: Music2, color: '#1d1d1f' },
  OTHER: { icon: Link2, color: '#6e6e73' },
};
