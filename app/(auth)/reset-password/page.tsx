'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api/auth';
import { validatePassword } from '@/lib/utils/auth-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="large-title text-[30px] sm:text-center text-danger">Enlace no válido</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            El enlace de restablecimiento es inválido o ha expirado.
          </Alert>
          <Link href="/forgot-password" className="block mt-4">
            <Button className="h-12 w-full text-[17px]">Solicitar Nuevo Enlace</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirm: 'Las contraseñas no coinciden' });
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ token, password });
      alert('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;

      if (errorMsg?.toLowerCase().includes('token') || errorMsg?.toLowerCase().includes('expirado')) {
        setErrors({ general: 'El enlace ha expirado. Por favor solicita uno nuevo.' });
      } else {
        setErrors({ general: 'Error al restablecer la contraseña. Por favor intenta de nuevo.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="large-title text-[30px] sm:text-center">Restablecer contraseña</CardTitle>
        <CardDescription className="text-base text-ink-3 sm:text-center">
          Ingresa tu nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && <Alert variant="destructive">{errors.general}</Alert>}

          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-danger">{errors.password}</p>}
            <p className="text-xs text-ink-3">
              Debe tener 8-128 caracteres, al menos una letra y un número
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.confirm && <p className="text-sm text-danger">{errors.confirm}</p>}
          </div>

          <Button type="submit" className="h-12 w-full text-[17px]" disabled={isLoading}>
            {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </Button>

          <div className="text-center space-y-2">
            <Link href="/forgot-password" className="block text-sm font-semibold text-brand hover:underline">
              Solicitar nuevo enlace
            </Link>
            <Link href="/login" className="block text-sm text-ink-3 hover:underline">
              Volver al login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="large-title text-[30px] sm:text-center">Restablecer contraseña</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-fill-2 border-t-brand"></div>
          </div>
        </CardContent>
      </Card>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
