export type Role = 'CLIENTE' | 'EMPRESA' | 'SOPORTE' | 'SUPER_ADMIN';

/**
 * Formats a role enum value to a human-readable string
 * @param role - The role enum value
 * @returns Formatted role string
 */
export function formatRole(role: Role): string {
  const roleMap: Record<Role, string> = {
    CLIENTE: 'Cliente',
    EMPRESA: 'Empresa',
    SOPORTE: 'Soporte',
    SUPER_ADMIN: 'Super Admin',
  };
  return roleMap[role] || role;
}

/**
 * Gets initials from a person's name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Gets the Tailwind color class for a role badge
 * @param role - The role enum value
 * @returns Tailwind color class name
 */
export function getRoleBadgeColor(role: Role): string {
  const colorMap: Record<Role, string> = {
    CLIENTE: 'bg-blue-100 text-blue-800 border-blue-200',
    EMPRESA: 'bg-green-100 text-green-800 border-green-200',
    SOPORTE: 'bg-orange-100 text-orange-800 border-orange-200',
    SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
  };
  return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Validates password against policy
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'La contraseña es requerida';
  }

  if (password.length < 8 || password.length > 128) {
    return 'La contraseña debe tener entre 8 y 128 caracteres';
  }

  if (!/[A-Za-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra';
  }

  if (!/\d/.test(password)) {
    return 'La contraseña debe incluir al menos un número';
  }

  return null;
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
