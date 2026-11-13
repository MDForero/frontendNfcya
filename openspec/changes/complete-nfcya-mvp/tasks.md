# Tasks: completar NFCYa — frontend

Marcar como completada solo con evidencia en código y pruebas. Numeración del paquete original; las tareas de backend están en `backend/openspec/changes/complete-nfcya-mvp/tasks.md`.

## Estado al 2026-11-13
- **Avance:** 43/47 tareas. Pendientes: 4.14 (solo el chip NFC; QR probado en teléfono real) y 5.4 (solo iOS; Android probado), 7.5 (HTTPS y URL pública, falta entorno), 7.10 (archivar al cerrar).
- **Pruebas (2026-11-13):** lint ✅, `tsc` ✅, `next build` ✅, smoke 45/45, auth-smoke 28/28, teléfono real Pixel 6a 40/42 + descargas verificadas a mano.
- **Últimos cambios:** pantalla `/admin/users` con alta de administradores y eliminación (6.6), vista previa sin barra de desplazamiento (2.13), teléfono del perfil público con botones WhatsApp y Llamar (2.15), smoke más robusto (ver `evidence.md` → «Cambios posteriores»).
- **Decisiones de alcance (2026-11-12):** el despliegue a producción (7.5) se coordinará con el equipo de desarrollo y no entra en la práctica; membresías y pagos Wompi (backlog 8.1, 8.2) no se desarrollan por tiempo. El MVP se considera funcional.
- **Archivado (2026-11-13):** `auth-frontend-integration` (67/67) → `openspec/changes/archive/2026-11-13-auth-frontend-integration/`; sus requisitos pasaron a `openspec/specs/auth/*` y `openspec/specs/ui/user-profile-display`.

## 0. Inspección y línea base
- [x] 0.1 Revisar repositorios, ramas y cambios OpenSpec existentes.
- [x] 0.2 Ejecutar instalación, lint, pruebas backend, pruebas frontend y build. — 2026-11-09: build + lint OK.
- [x] 0.3 Registrar errores preexistentes.
- [x] 0.4 Confirmar prefijo API, CORS, puertos, cookies y variables de entorno. — `NEXT_PUBLIC_API_URL=http://localhost:3001`, sin prefijo; ver tasks del backend.

## 1. P0 — Autenticación e integración
- [x] 1.7 Corregir restauración de sesión al cargar. — restauración única; páginas públicas no la lanzan (`ensureSession`).
- [x] 1.8 Evitar timers duplicados/ciclo de refresh en AuthContext. — un solo timer, reprogramado desde `onSessionChange`.
- [x] 1.9 Excluir login/refresh del interceptor automático 401.
- [x] 1.10 Mantener una sola promesa de refresh simultáneo y reintentar solicitud original una sola vez. — `refreshSession()` compartido por AuthProvider e interceptor (evita reutilizar el token rotado).
- [x] 1.11 Si refresh falla, limpiar estado y redirigir una sola vez. — `endSession()` → `RequireAuth` redirige una vez.
- [x] 1.12 Revisar `proxy.ts` según Next.js 16; no depender de cookie inaccesible por path. — sin `proxy.ts`: la cookie es del origen de la API con `Path=/auth`; protección en cliente.
- [x] 1.13 Corregir TypeScript y componentes JSX que bloqueen build.
- [x] 1.14 Configurar `lang="es"`, accesibilidad básica y retirar logs. — `lang="es"`, aria-labels, sin `console.*`.
- [x] 1.15 Ejecutar 10 pruebas manuales: registro/verificación/login; login inválido; refresh; refresh inválido; rutas protegidas; logout; logout-all; recuperación/restablecimiento; cambio contraseña; rol/suspensión. — las 10 en `e2e/smoke.mjs` + `e2e/auth-smoke.mjs` (35/35 y 28/28, 2026-11-09).
- [x] 1.16 Documentar evidencia y defectos. — `evidence.md` (resultados, defectos D1–D6, riesgos abiertos).

## 2. P0 — Perfiles digitales
- [x] 2.10 Crear sección Perfil en dashboard.
- [x] 2.11 Formulario de datos básicos, slug y visibilidad.
- [x] 2.12 Mostrar errores de validación y slug duplicado.
- [x] 2.13 Crear vista previa. — marco de teléfono; desde 2026-11-12 desplazable sin barra visible (spec `ui/responsive-design`).
- [x] 2.14 Crear acciones guardar/publicar/despublicar.
- [x] 2.15 Crear página pública responsive por slug. — desde 2026-11-12 botones WhatsApp y Llamar; el número abre WhatsApp y el email `mailto:`.
- [x] 2.16 Manejar loading, no encontrado, borrador/no publicado y error. — smoke: no disponible / error con reintento.
- [x] 2.17 No mostrar campos privados.

## 3. P0 — Enlaces
- [x] 3.8 Lista de enlaces y formulario crear/editar.
- [x] 3.9 Eliminar con confirmación y activar/desactivar.
- [x] 3.10 Ordenar con drag-and-drop o controles subir/bajar. — subir/bajar con reorden transaccional.
- [x] 3.11 Mostrar enlaces en perfil público en el orden correcto.

## 4. P0 — NFC y QR
- [x] 4.9 Crear sección “NFC y QR”.
- [x] 4.10 Mostrar URL y botón copiar.
- [x] 4.11 Generar/mostrar QR descargable si el repositorio lo permite. — `qrcode`, PNG descargable.
- [x] 4.12 Mostrar estado y permitir desactivar.
- [x] 4.13 Documentar cómo grabar URL HTTPS en chip NFC. — README → «Perfil público y NFC» y ayuda en `/nfc-qr`.
- [ ] 4.14 Probar con teléfono real. — QR ✅ en Pixel 6a (2026-11-13, ver `evidence.md`); falta grabar/leer el chip NFC (NFC del teléfono de prueba dañado).

## 5. P1 — vCard y leads
- [x] 5.3 Frontend: botón descargar/guardar contacto.
- [ ] 5.4 Probar descarga e importación móvil. — Android ✅ (Pixel 6a, 2026-11-13: descarga del `.vcf` y Contactos lo abre); falta iOS (requiere URL pública).
- [x] 5.5 Si se aprueba leads: formulario con consentimiento explícito.
- [x] 5.8 Frontend: confirmación y vista privada básica de leads si hay tiempo.

## 6. P1 — Administración mínima
- [x] 6.4 Frontend: navegación admin condicionada por rol.
- [x] 6.5 Frontend: tabla/listado, búsqueda, paginación y detalle básico. — tabla/tarjetas, búsqueda, filtro, paginación, suspender/reactivar.
- [x] 6.6 Frontend: `/admin/users` (pestañas Perfiles | Usuarios): listado con filtros, cambio de rol y organización, suspender/reactivar, reenviar enlaces, alta de administradores (solo `SUPER_ADMIN`) y eliminación con confirmación por email. — `e2e/smoke.mjs` § Administración de usuarios; 44/44.

## 7. Calidad y entrega
- [x] 7.1 Ejecutar todas las pruebas backend/frontend. — lint, build y `e2e/smoke.mjs` 35/35 (Chromium real, escritorio y móvil).
- [x] 7.2 Ejecutar build/compilación de producción.
- [ ] 7.5 Verificar HTTPS, CORS, cookies y URL pública en entorno acordado.
- [x] 7.6 Revisar logs y datos sensibles. — `console.*` retirados; tokens solo en memoria.
- [x] 7.7 Documentar instalación, ejecución, migraciones, pruebas y limitaciones. — `README.md`.
- [x] 7.8 Registrar backlog no entregado. — ver design.md del backend «Backlog no entregado».
- [x] 7.9 Preparar demostración basada solo en funcionalidades verificadas. — `demo.md` + `pnpm seed:demo` en el backend.
- [ ] 7.10 Archivar cambios OpenSpec completados.
