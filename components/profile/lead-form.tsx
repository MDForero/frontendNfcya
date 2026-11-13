'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Send } from 'lucide-react';
import { getLeadConsentText, LeadSource, ProfileTheme, sendLead } from '@/lib/api/profiles';
import { apiErrorMessage } from '@/lib/api/client';
import { profileAccent, profileButtonClass } from '@/components/profile/public-profile-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

const FALLBACK_PURPOSE =
  'Autorizo que el titular de este perfil use mis datos solo para contactarme.';

/** Formulario público "Déjame tus datos". Nada se envía sin la casilla de consentimiento. */
export function LeadForm({ slug, source, theme }: { slug: string; source: LeadSource; theme: ProfileTheme }) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState(FALLBACK_PURPOSE);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const accent = profileAccent(theme);

  useEffect(() => {
    if (open) getLeadConsentText().then(setPurpose).catch(() => undefined);
  }, [open]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Escribe tu nombre.');
    if (!form.email.trim() && !form.phone.trim()) return setError('Indica un email o un teléfono.');
    if (!consent) return setError('Debes aceptar el tratamiento de datos para enviar el formulario.');

    setSending(true);
    try {
      await sendLead(slug, {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        consentAccepted: true,
        source,
      });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo enviar. Inténtalo de nuevo.'));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-[20px] bg-white p-4 text-left text-[15px] text-ink">
        <CircleCheck className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />
        ¡Gracias! Tus datos se enviaron al titular del perfil.
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className={profileButtonClass(theme, 'secondary')} onClick={() => setOpen(true)}>
        <Send className="h-5 w-5" aria-hidden="true" /> Déjame tus datos
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[24px] bg-white p-5 text-left text-ink" noValidate>
      <div>
        <h2 className="text-xl font-bold tracking-tight">Déjame tus datos</h2>
        <p className="mt-1 text-sm text-ink-3">Te contactaré lo antes posible.</p>
      </div>
      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="lead-name">Nombre *</Label>
        <Input id="lead-name" value={form.name} onChange={set('name')} maxLength={120} autoComplete="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-email">Email</Label>
        <Input id="lead-email" type="email" value={form.email} onChange={set('email')} maxLength={254} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-phone">Teléfono</Label>
        <Input id="lead-phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={30} autoComplete="tel" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-message">Mensaje</Label>
        <textarea
          id="lead-message"
          value={form.message}
          onChange={set('message')}
          maxLength={1000}
          rows={3}
          className="w-full rounded-xl border border-transparent bg-fill px-3.5 py-2.5 text-base outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-ring/20"
        />
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-fill p-3.5 text-sm leading-snug">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ accentColor: accent }}
        />
        <span>{purpose}</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={profileButtonClass(theme, 'secondary')} onClick={() => setOpen(false)} disabled={sending}>
          Cancelar
        </button>
        <button type="submit" className={profileButtonClass(theme, 'primary')} style={{ background: accent }} disabled={sending}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </form>
  );
}
