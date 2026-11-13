/**
 * Destino tras iniciar sesión: el `callbackUrl` de la URL actual si es una ruta interna
 * ("/algo", nunca "//dominio" ni "/\dominio", que el navegador trata como externas).
 */
export function getSafeCallbackUrl(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
  if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.startsWith('/\\')) {
    return callbackUrl;
  }
  return '/dashboard';
}
