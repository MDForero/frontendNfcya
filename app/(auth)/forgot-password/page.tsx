'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api/auth';
import { validateEmail } from '@/lib/utils/auth-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !validateEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email.toLowerCase());
      setSuccess(true);
    } catch (error: any) {
      setError('Error al enviar el email. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="large-title text-[30px] sm:text-center">Email Enviado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-brand-soft">
            <p className="text-sm text-brand-strong">
              Te hemos enviado un email a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
            </p>
          </Alert>
          <Link href="/login">
            <Button className="h-12 w-full text-[17px]">Volver al Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="large-title text-[30px] sm:text-center">¿Olvidaste tu contraseña?</CardTitle>
        <CardDescription className="text-base text-ink-3 sm:text-center">
          Ingresa tu email y te enviaremos instrucciones para restablecerla
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="h-12 w-full text-[17px]" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
          </Button>

          <p className="text-center text-sm text-ink-3">
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Volver al login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
