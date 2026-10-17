'use client';

import { useAuth } from '@/contexts/auth-context';
import { formatRole } from '@/lib/utils/auth-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido a tu panel de control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Rol</p>
              <div>
                <Badge className="bg-blue-100 text-blue-800">
                  {formatRole(user.role)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <div>
                <Badge variant={user.status === 'ACTIVA' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Verificado</p>
              <p className="font-medium">
                {user.emailVerifiedAt ? 'Sí' : 'No'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/change-password"
                className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">Cambiar Contraseña</p>
                <p className="text-sm text-gray-500">Actualiza tu contraseña</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
