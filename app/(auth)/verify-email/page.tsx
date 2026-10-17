'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail, resendVerification } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    const verify = async () => {
      try {
        console.log('[VerifyEmail] Attempting to verify with token:', token);
        await verifyEmail(token);
        setStatus('success');
        setMessage('¡Email verificado exitosamente!');
        console.log('[VerifyEmail] Verification successful');
      } catch (error: any) {
        console.error('[VerifyEmail] Verification failed:', error);
        console.error('[VerifyEmail] Error response:', error.response?.data);
        setStatus('error');
        const errorMsg = error.response?.data?.message || error.message;
        setMessage(errorMsg || 'Error al verificar el email. El token puede ser inválido o haber expirado.');
      }
    };

    verify();
  }, [searchParams]);

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
        <CardTitle className="text-2xl font-bold text-center">
          Verificación de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando tu email...</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <p className="text-green-800">{message}</p>
            </Alert>
            <div className="text-center">
              <Link href="/login">
                <Button className="w-full">
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
              <p className="text-sm text-gray-600 text-center">
                ¿Necesitas un nuevo enlace de verificación?
              </p>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
              <Button onClick={handleResend} className="w-full" disabled={isResending}>
                {isResending ? 'Reenviando...' : 'Reenviar Email de Verificación'}
              </Button>
              <Link href="/login" className="block text-center">
                <Button variant="outline" className="w-full">
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
          <CardTitle className="text-2xl font-bold text-center">
            Verificación de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </CardContent>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
