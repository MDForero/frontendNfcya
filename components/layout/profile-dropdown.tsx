'use client';

import { useAuth } from '@/contexts/auth-context';
import { formatRole, getInitials, getRoleBadgeColor } from '@/lib/utils/auth-helpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { User, LogOut, KeyRound } from 'lucide-react';

export default function ProfileDropdown() {
  const { user, logout, logoutAll } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
  };

  const handleLogoutAll = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar todas las sesiones?')) {
      await logoutAll();
    }
  };

  const handleChangePassword = () => {
    router.push('/change-password');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
          <AvatarFallback className="bg-blue-600 text-white font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-gray-500">{user.email}</p>
            <div className="pt-1">
              <Badge
                variant="outline"
                className={`text-xs ${getRoleBadgeColor(user.role)}`}
              >
                {formatRole(user.role)}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleChangePassword} className="cursor-pointer">
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Cambiar contraseña</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleLogoutAll}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar todas las sesiones</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
