import type { MetadataRoute } from 'next';

/** Permite «Añadir a pantalla de inicio» con el ícono de NFCya (Android/Chrome). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NFCya',
    short_name: 'NFCya',
    description: 'Perfiles digitales para compartir por NFC y QR',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f5f5f7',
    theme_color: '#ffffff',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
