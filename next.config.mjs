/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Validación de "navegación instantánea" (solo en dev) únicamente donde se pide con
  // `export const instant`. Las rutas protegidas esperan la sesión en el navegador
  // (RequireAuth) y nunca pueden ser instantáneas; sus páginas son Client Components y
  // no pueden declarar `instant = false`, así que con la validación por defecto Next
  // avisaba "segment dropped from rendering" en cada una.
  experimental: {
    instantInsights: { validationLevel: 'manual-warning' },
  },
  // The API builds email links as FRONTEND_URL/auth/<page>?token=… (backend
  // README contract); the pages live at /<page>. Query strings are preserved.
  async redirects() {
    return [
      { source: '/auth/verify-email', destination: '/verify-email', permanent: false },
      { source: '/auth/reset-password', destination: '/reset-password', permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
