'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail } from '@/lib/utils/auth-helpers';
import { getSafeCallbackUrl } from '@/lib/utils/callback-url';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { GoogleLoginButton } from '@/components/auth/google-button';

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.toLowerCase(), password });

      // Redirect to callback URL or dashboard
      router.push(getSafeCallbackUrl());
    } catch (error: any) {

      // The API returns a stable `code` (see backend README); its messages may change.
      const code: string | undefined = error.response?.data?.code;
      const messages: Record<string, string> = {
        INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
        EMAIL_NOT_VERIFIED: 'Por favor verifica tu email antes de iniciar sesión',
        ACCOUNT_SUSPENDED: 'Tu cuenta está suspendida. Contacta al soporte.',
        TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.',
      };

      setErrors({
        general:
          (code && messages[code]) ||
          (error.response?.status === 429
            ? 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
            : 'Error al iniciar sesión. Por favor intenta de nuevo.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="large-title text-[34px] sm:text-center">Hola de nuevo</CardTitle>
        <CardDescription className="text-base text-ink-3 sm:text-center">Entra para gestionar tu tarjeta digital.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive">
              {errors.general}
            </Alert>
          )}

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
            {errors.email && <p className="text-sm text-danger">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-danger">{errors.password}</p>}
          </div>

          <div className="flex justify-end text-[15px]">
            <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" className="h-12 w-full text-[17px]" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>

          <GoogleLoginButton />

          <p className="text-center text-sm text-ink-3">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-semibold text-brand hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// The form doesn't depend on the URL, so it renders without a Suspense fallback;
// callbackUrl is read only when the login succeeds.
export default function LoginPage() {
  return <LoginForm />;
}

