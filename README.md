# nfcYA — Frontend

Cliente web de nfcYA (Next.js 16 App Router + React 19 + Tailwind 4 + shadcn/ui sobre Base UI). Consume la API de [`../backend`](../backend).

Los requisitos están en [`openspec/`](openspec/): especificaciones vigentes en `openspec/specs/` (autenticación, sesión, rutas protegidas, perfil de usuario), el cambio en curso `complete-nfcya-mvp` (perfil, enlaces, NFC/QR, perfil público, administración) y `auth-frontend-integration` ya archivado en `openspec/changes/archive/`.

> Next 16 cambia APIs y convenciones respecto a versiones anteriores: antes de tocar rutas o caché, consulta `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Puesta en marcha

Requisitos: Node 22, pnpm y el backend corriendo (por defecto en `http://localhost:3001`).

```bash
pnpm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
# opcional, solo con credenciales de Google configuradas en la API:
# echo "NEXT_PUBLIC_GOOGLE_LOGIN=true" >> .env.local
pnpm dev            # http://localhost:3000
```

El backend debe tener `FRONTEND_URL=http://localhost:3000` (CORS con credenciales y enlaces de los correos).

| Script | Qué hace |
|---|---|
| `pnpm dev` | Desarrollo con recarga en caliente |
| `pnpm build` / `pnpm start` | Build de producción y servidor |
| `pnpm lint` | ESLint (incluye las reglas del React Compiler) |

## Rutas

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | público | Autenticación |
| `/dashboard` | autenticado | Inicio: estado del perfil y accesos según rol |
| `/profile` | CLIENTE, EMPRESA | Crear/editar perfil, slug con disponibilidad en vivo, vista previa, publicar |
| `/links` | CLIENTE, EMPRESA | Enlaces: crear, editar, ocultar, ordenar, eliminar |
| `/nfc-qr` | CLIENTE, EMPRESA | Códigos NFC/QR: URL, copiar, QR en PNG, desactivar/revocar |
| `/leads` | CLIENTE, EMPRESA | Contactos recibidos |
| `/admin/profiles` | SUPER_ADMIN, SOPORTE, EMPRESA | Listado, búsqueda, filtro y suspensión de perfiles |
| `/change-password` | autenticado | Cambio de contraseña |
| `/auth/callback` | público | Vuelta del login con Google (la API ya escribió la cookie, o llega `?error=`) |
| `/p/:slug` | público | Perfil público, "Guardar contacto" (vCard) y formulario de contacto |
| `/r/:code` | público | Destino grabado en el chip NFC / impreso en el QR; redirige a `/p/:slug` |

La navegación por rol solo es experiencia de usuario: la API comprueba rol y propiedad en cada petición.

## Diseño visual

Estilo inspirado en las apps de Apple (diseño aprobado el 2026-11-09):

- **Paleta** (tokens en `app/globals.css`, clases `bg-brand`, `text-ink-3`, etc.): fondo `#F5F5F7`, tarjetas blancas, texto `#1D1D1F` y secundario `#6E6E73`; azul `#0071E3` para acciones; naranja `#FF7A1A` como acento (solo decorativo o con texto oscuro); verde y rojo solo para estados.
- **Tipografía**: Inter (`next/font`); títulos grandes con la clase `large-title`.
- **Componentes**: botones en píldora, campos con relleno suave, tarjetas con radio grande, listas agrupadas (`GroupedList`), interruptores tipo iOS (`components/ui/switch.tsx`, un checkbox nativo con `role="switch"`), barras translúcidas (`glass`, `glass-white`).
- **Navegación**: en escritorio, barra superior con pestañas en píldora; en móvil, barra de pestañas inferior (`nav[aria-label="Secciones"]`).
- **Perfil público**: ficha tipo contacto de iOS. Cada tema (`DEFAULT`, `DARK`, `OCEAN`, `SUNSET`, `FOREST`) define un color de acento con contraste ≥ 4.5:1 con texto blanco.

## Sesión

- El access token vive solo en memoria; el refresh token es la cookie httpOnly `nfcya_rt` de la API (`Path=/auth`), así que Next no puede leerla: la protección de rutas se hace en el cliente (`components/auth/auth-guards.tsx`) y no hay `proxy.ts`.
- Todas las renovaciones pasan por `refreshSession()` (`lib/api/client.ts`): una sola petición `/auth/refresh` compartida. Si salieran dos a la vez, el backend detectaría la reutilización del refresh token rotado y cerraría todas las sesiones.
- Ante un 401, el interceptor renueva y reintenta la petición una sola vez. Login, refresh y las rutas públicas de auth quedan excluidas. Si la renovación falla, se limpia la sesión y `RequireAuth` redirige una sola vez a `/login?callbackUrl=…`.
- Las páginas públicas (`/p`, `/r`) no restauran sesión al cargar.

## Perfil público y NFC

- `/p/:slug` se renderiza en el cliente para que el rate limit de la API cuente la IP de cada visitante. Si lo pidiera el servidor de Next, todas las visitas compartirían una IP. Por eso no hay vista previa OG al compartir el enlace (queda en el backlog).
- Todo el contenido del perfil se pinta como texto (sin HTML), y los enlaces se filtran de nuevo a `http(s)`/`mailto:`/`tel:`.
- **Grabar un chip NFC**: en `/nfc-qr` crea un código "Chip NFC" y copia su URL (`…/r/<código>`). En el teléfono, con una app como *NFC Tools*: Escribir → Agregar registro → URL/URI → pegar la URL → acercar el chip. El chip solo guarda la URL, sin datos personales. Si se pierde la tarjeta, desactiva o revoca el código.
- En producción la URL debe ser HTTPS (`PUBLIC_BASE_URL` en el backend).

## Pruebas

Dos suites en `e2e/` recorren la app en un Chromium real, en escritorio y en móviles emulados:

- **`smoke.mjs`** (38 comprobaciones; incluye móvil del propietario y capturas del diseño), producto: login inválido sin refresh, login, crear y publicar perfil, enlaces, URL peligrosa, NFC, visitante móvil por `/r/:code`, vCard, lead con y sin consentimiento, recarga con un solo refresh, desactivar código, despublicar, slug ocupado, permisos, suspensión auditada, logout y ruta protegida.
- **`auth-smoke.mjs`** (28 comprobaciones), autenticación: registro, verificación por correo y login; callbackUrl; navegación sin re-autenticar; error de red; renovación proactiva; refresh inválido con una sola redirección; logout-all; recuperación y cambio de contraseña con cierre de sesiones; color del badge por rol; Google con `/auth/callback`.

```bash
# backend con MAIL_TRANSPORT=log y su salida en un archivo; frontend levantado
# (para auth-smoke: JWT_ACCESS_TTL_SECONDS=310 y AUTH_THROTTLE_LIMIT=1000 en el backend)
API_URL=http://localhost:3001 WEB_URL=http://localhost:3000 \
BACKEND_LOG=/tmp/backend.log DB_URL=postgres://nfcya:nfcya@localhost:5432/nfcya \
CHROME_PATH=/ruta/a/chrome node e2e/smoke.mjs      # o e2e/auth-smoke.mjs
```

Necesitan `playwright-core` y un Chrome/Chromium. Crean usuarios con sufijo aleatorio en la base indicada y modifican roles y estados con `psql`, así que usa la base de desarrollo, nunca la de producción. Resultados y defectos: `openspec/changes/complete-nfcya-mvp/evidence.md`. Guion de la demo: `openspec/changes/complete-nfcya-mvp/demo.md`.

## Limitaciones conocidas

- Sin vista previa OG ni indexación de perfiles (`robots: noindex`), por decisión pendiente.
- Las imágenes del perfil son URLs `https` externas (no hay subida).
- Las pruebas con teléfono real (escaneo NFC/QR, importar la vCard en iOS/Android) son manuales y siguen pendientes.
