'use client';

import { useState } from 'react';
import { changePassword } from '@/lib/api/auth';
import { validatePassword } from '@/lib/utils/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ current?: string; newPassword?: string; confirm?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!currentPassword) {
      setErrors({ current: 'La contraseña actual es requerida' });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirm: 'Las contraseñas no coinciden' });
      return;
    }

    if (currentPassword === newPassword) {
      setErrors({ newPassword: 'La nueva contraseña debe ser diferente a la actual' });
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Contraseña cambiada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;

      if (errorMsg?.toLowerCase().includes('actual') || errorMsg?.toLowerCase().includes('incorrecta')) {
        setErrors({ current: 'La contraseña actual es incorrecta' });
      } else {
        toast.error('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.current && <p className="text-sm text-danger">{errors.current}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.newPassword && <p className="text-sm text-danger">{errors.newPassword}</p>}
              <p className="text-xs text-ink-3">
                Debe tener 8-128 caracteres, al menos una letra y un número
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
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

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
