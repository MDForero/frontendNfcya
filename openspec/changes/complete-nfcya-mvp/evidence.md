# Evidencia de pruebas y defectos (tareas 1.15, 1.16)

Fecha: 2026-11-09. Entorno: backend y frontend de producción (`nest build`, `next build`) en local, PostgreSQL 16, Chromium headless (Playwright), viewport de escritorio y móviles emulados (Pixel 7, iPhone 13). Las pruebas se automatizaron para poder repetirlas antes de cada entrega.

## Resultados

| Suite | Comprobaciones | Resultado |
|---|---|---|
| Backend unitarias (`pnpm test`) | 101 | ✅ 101/101 |
| Backend e2e (`pnpm test:e2e`) | 174 | ✅ 174/174 (2026-11-12) |
| Frontend `pnpm lint` + `pnpm build` | — | ✅ |
| `frontend/e2e/smoke.mjs` (producto) | 45 | ✅ 45/45 (2026-11-12, incluye administración de usuarios y WhatsApp) |
| `frontend/e2e/auth-smoke.mjs` (autenticación) | 28 | ✅ 28/28 |

## Las 10 pruebas de autenticación (tarea 1.15)

| # | Prueba | Cómo se verificó | Resultado |
|---|---|---|---|
| 1 | Registro → verificación → login | `auth-smoke` §1: registro por la UI, login bloqueado sin verificar, enlace del correo, login → dashboard | ✅ |
| 2 | Login inválido | `smoke`: muestra «Email o contraseña incorrectos» y **no** llama a `/auth/refresh` | ✅ |
| 3 | Refresh | `auth-smoke` §4: renovación proactiva sin interacción (TTL 310 s → a los ~10 s) y la sesión sigue · `smoke`: recargar = un solo `/auth/refresh` | ✅ |
| 4 | Refresh inválido | `auth-smoke` §5: cuenta suspendida a mitad de sesión → un solo intento de refresh y **una sola** redirección a `/login`; refresh revocado al recargar → `/login` | ✅ |
| 5 | Rutas protegidas | `auth-smoke` §2: `/links` sin sesión → `/login?callbackUrl=%2Flinks` → tras login vuelve a `/links`; 5 navegaciones internas sin re-autenticar | ✅ (tras corregir D1) |
| 6 | Logout | `smoke`: menú de cuenta → `/login`; ruta protegida después → `/login` | ✅ |
| 7 | Logout-all | `auth-smoke` §6: dos navegadores; «Cerrar todas las sesiones» en uno → ambos a `/login` | ✅ |
| 8 | Recuperación / restablecimiento | `auth-smoke` §7: correo → enlace → nueva contraseña; la anterior falla, la nueva entra, se cierran sesiones abiertas y el enlace es de un solo uso | ✅ |
| 9 | Cambio de contraseña | `auth-smoke` §8: actual incorrecta → error en el campo; cambio correcto mantiene la sesión actual y cierra las demás; login con la nueva | ✅ |
| 10 | Rol / suspensión | `smoke`: navegación por rol, CLIENTE sin acceso a administración, suspensión de perfil auditada · `auth-smoke` §5 y §9: cuenta suspendida, color del badge por rol (4 roles) | ✅ |

Extra: error de red en el login (`auth-smoke` §3) y el botón de Google con `/auth/callback`, tanto con error como con sesión (§10).

## Defectos encontrados y corregidos

| ID | Defecto | Impacto | Corrección |
|---|---|---|---|
| D1 | Tras el login no se volvía a la URL protegida pedida: `RedirectIfAuthenticated` hacía `replace('/dashboard')` y pisaba el `push(callbackUrl)` del formulario | Medio: siempre se terminaba en el dashboard | `lib/utils/callback-url.ts` compartido por el formulario y el guard |
| D2 | Refresh proactivo y refresh del interceptor eran peticiones independientes; si coincidían, el backend detectaba la reutilización del token rotado y revocaba **todas** las sesiones | Alto (intermitente) | `refreshSession()` único compartido (`lib/api/client.ts`) |
| D3 | El frontend no tenía botón de Google ni página `/auth/callback`: con credenciales reales el flujo acababa en 404 | Alto para Google | `components/auth/google-button.tsx` (con `NEXT_PUBLIC_GOOGLE_LOGIN=true`) y `app/auth/callback` |
| D4 | vCard: `;` sin escapar | Bajo | `escapeVCard` + prueba unitaria |
| D5 | `MAIL_TRANSPORT=log` permitido en producción (escribe tokens en el log) | Alto si se desplegara así | Rechazado en `validateEnv` + prueba |
| D6 | Logs de depuración (`console.*`) en el cliente, incluidos datos de usuario | Bajo | Eliminados |

## Riesgos abiertos (no corregidos)

- ~~Throttle de `/auth` por IP (20/min) incluía `/auth/refresh`~~ — **resuelto 2026-11-11**: `/auth/refresh`, `/auth/logout` y `/auth/logout-all` tienen límite propio (`AUTH_SESSION_THROTTLE_LIMIT`, 300/min por IP); login/registro siguen en 20/min. El frontend ya no cierra la sesión ante un 429/red/5xx al renovar (reintenta). `TRUST_PROXY` para que detrás de un proxy el límite use la IP real. Prueba: `backend/test/throttle.e2e-spec.ts`.
- Login real con Google: el flujo está probado hasta la API (sin credenciales responde `google_disabled`). Falta la prueba con credenciales reales.
- Pruebas con teléfono físico: QR e importación de vCard en Android hechas (2026-11-13). Pendientes: chip NFC (teléfono de prueba con NFC dañado) e importación en iOS (4.14, 5.4).

## Cambios posteriores (2026-11-11 / 2026-11-12)

- **Integridad de la BD** (2026-11-11): revisado el modelo entidad-relación y las reglas de borrado (cascada usuario → perfil → enlaces/códigos/leads; `RESTRICT` en organizaciones con usuarios). `audit_logs` sin FK a propósito (documentado en `backend/.../design.md` → «Borrado e integridad»).
- **Administración de usuarios** (2026-11-12): alta de `SUPER_ADMIN`/`SOPORTE` por invitación, eliminación definitiva con confirmación y pantalla `/admin/users` (tareas backend 6.7, frontend 6.6). Probado en e2e y en el smoke (7 comprobaciones nuevas).
- **Smoke más robusto** (2026-11-12): tres fallos eran del propio script, no de la app: (1) contaba el `/auth/refresh` de la restauración de sesión, que en `next dev` llega tras `networkidle`; (2) la captura del login móvil antes de hidratar inyectaba `caret-color` y Next mostraba un aviso de hidratación cuyo badge tapaba la barra inferior; (3) `getByText('Desactivado')` también encontraba el toast. Corregidos en `e2e/smoke.mjs`.
- **Vista previa del perfil** (2026-11-12): sin barra de desplazamiento visible (quedaba recortada por el marco), `overscroll-contain` y foco por teclado. Verificado en 1280 px y 1024 px: barra de 0 px y desplazamiento con rueda.
- **Teléfono → WhatsApp** (2026-11-12): en el perfil público hay dos acciones rápidas, «WhatsApp» (`https://wa.me/…`) y «Llamar» (`tel:`, para fijos o quien prefiera llamar), y el número del dato de contacto abre WhatsApp; con email y sitio web visibles los 4 botones caben a 360 px sin scroll horizontal; el email sigue con `mailto:` (cliente de correo predeterminado, p. ej. Outlook). El editor indica que se use el indicativo (sin él se asume +57). La vCard conserva el teléfono. Smoke: comprobación nueva y la de orden de enlaces ahora mira solo la sección «Enlaces».

## Corrida completa (2026-11-13)

Copia aislada (web :3100, API :3101, base `nfcya_test`), `next dev` arrancado sin caché.

| Suite | Resultado |
|---|---|
| Backend unitarias | 101/101 |
| Backend e2e | 174/174 (11 suites) |
| Backend lint / `tsc` | ✅ / ✅ (los 2 errores de tipos de `test/profiles.e2e-spec.ts` se corrigieron el mismo día) |
| Frontend lint / `tsc` / `next build` | ✅ / ✅ / ✅ (22 rutas) |
| `e2e/smoke.mjs` | 45/45 |
| `e2e/auth-smoke.mjs` | 28/28 |

`auth-smoke` dio 20/22 en la primera corrida, por fallos del script y no de la app: (1) con `next dev` sin compilar, el `/auth/refresh` de la restauración de sesión llegaba tarde y se contaba como re-autenticación al navegar (el mismo caso que se corrigió en `smoke` el 11-12; ahora se espera antes de contar). Una traza con el servidor compilado mostró 0 refresh en las 5 navegaciones. (2) El texto esperado tras cambiar la contraseña era el anterior a los toasts; ahora es «Contraseña cambiada correctamente.». Tras corregir el script: 28/28 con el servidor otra vez sin caché.

## Teléfono real (2026-11-13)

Pixel 6a, Android 17, navegador Brave (Chromium 157) controlado por USB (`adb forward` a `chrome_devtools_remote` + `connectOverCDP`). La app corría en una copia aislada (web :3100, API :3101, base `nfcya_test`) expuesta al teléfono con `adb reverse`, así que el teléfono la abría como `localhost`, que es un contexto seguro. Viewport 411×736, DPR 2,625, táctil.

Resultado: **40/42 comprobaciones**. Las 2 fallidas eran las descargas: Playwright intercepta las descargas del navegador remoto y Brave pide confirmar la ubicación. Se repitieron a mano con `adb`, sin Playwright conectado.

- Registro, verificación de email abriendo el enlace y login (error y éxito). Barra de pestañas inferior anclada al borde y menú superior oculto.
- Crear, publicar y editar el perfil; crear, ocultar y reordenar enlaces; rechazo de `javascript:`.
- QR: se crea el código y la imagen mostrada se decodifica (jsQR) a la URL `/r/:code`; abrir esa URL lleva a `/p/:slug?src=qr`. Un QR desactivado muestra «Código no disponible».
- Perfil público: privacidad (email oculto), orden de enlaces, botones WhatsApp y Llamar, sin `/auth/refresh`, objetivos táctiles ≥ 40 px.
- Lead: sin consentimiento se bloquea; con consentimiento se envía, y el propietario lo ve con fuente QR.
- Recarga con un único `/auth/refresh`. SUPER_ADMIN en el teléfono: buscar y suspender (con `confirm` nativo); pestaña Usuarios; perfil suspendido no disponible. Logout; ruta protegida → `/login?callbackUrl=…`.
- Sin scroll horizontal en registro, dashboard, editor, enlaces, NFC y QR, contactos, administración y perfil público. Sin errores de consola.
- **vCard (Android):** tocar «Guardar contacto» descarga `<slug>.vcf` en Descargas (`text/vcard`, nombre, cargo con `;` escapado, teléfono, URL y nota correctos, sin el email privado). Android ofrece «Contactos» para abrirlo. No se importó para no tocar la agenda real.
- No probado: grabar/leer el chip NFC (hardware dañado), escanear el QR impreso con la cámara de otro dispositivo (se verificó decodificando la imagen), descarga del PNG del QR fuera de Playwright, iOS.

## Cómo repetirlo

Ver `frontend/README.md` → Pruebas. Para `auth-smoke.mjs` el backend debe arrancar con `MAIL_TRANSPORT=log`, `JWT_ACCESS_TTL_SECONDS=310` y `AUTH_THROTTLE_LIMIT=1000`, con su salida redirigida a un archivo (`BACKEND_LOG`).
