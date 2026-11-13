'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail, resendVerification } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [result, setResult] = useState<{ status: Status; message: string } | null>(null);
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  // The token is single-use: verify each one once, even when React StrictMode
  // runs the effect twice in dev (the second call would fail and show an error).
  const verifiedTokenRef = useRef<string | null>(null);

  // A missing token is derived during render instead of set from the effect
  const status: Status = !token ? 'error' : result?.status ?? 'loading';
  const message = !token ? 'Token de verificación no encontrado' : result?.message ?? '';

  const setStatus = (next: Status) => setResult((prev) => ({ status: next, message: prev?.message ?? '' }));
  const setMessage = (next: string) => setResult((prev) => ({ status: prev?.status ?? 'loading', message: next }));

  useEffect(() => {
    if (!token || verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('¡Email verificado exitosamente!');
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error.response?.data?.message || error.message;
        setMessage(errorMsg || 'Error al verificar el email. El token puede ser inválido o haber expirado.');
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (!email) {
      alert('Por favor ingresa tu email');
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(email);
      alert('Email de verificación reenviado. Por favor revisa tu bandeja de entrada.');
    } catch (error) {
      alert('Error al reenviar el email. Por favor intenta de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="large-title text-[30px] sm:text-center">
          Verificación de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-fill-2 border-t-brand mx-auto"></div>
            <p className="mt-4 text-ink-3">Verificando tu email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <Alert className="bg-success-soft">
              <p className="text-success-ink">{message}</p>
            </Alert>
            <div className="text-center">
              <Link href="/login">
                <Button className="h-12 w-full text-[17px]">
                  Ir al Login
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert variant="destructive">
              {message}
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-ink-3 text-center">
                ¿Necesitas un nuevo enlace de verificación?
              </p>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <Button onClick={handleResend} className="h-12 w-full text-[17px]" disabled={isResending}>
                {isResending ? 'Reenviando...' : 'Reenviar Email de Verificación'}
              </Button>
              <Link href="/login" className="block text-center">
                <Button variant="outline" className="h-12 w-full text-[17px]">
                  Volver al Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="large-title text-[30px] sm:text-center">
            Verificación de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-fill-2 border-t-brand mx-auto"></div>
          <p className="mt-4 text-ink-3">Cargando...</p>
        </CardContent>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
