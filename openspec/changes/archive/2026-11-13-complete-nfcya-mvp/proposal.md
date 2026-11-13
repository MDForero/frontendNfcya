# Proposal

## Why
NFCYa ya dispone de una base importante de autenticación, sesiones y control de acceso, así como interfaces iniciales. Sin embargo, aún falta el flujo central del producto: que una persona o empresa gestione un perfil digital, comparta una URL por NFC o QR y permita a visitantes consultar la información pública. La integración frontend-backend no estaba validada al corte del informe.

## What Changes
Cambio compartido con `backend/openspec/changes/archive/2026-11-13-complete-nfcya-mvp` (mismo nombre). Este repositorio cubre la parte de **frontend**.

1. Estabilizar autenticación existente sin reconstruirla.
2. Implementar perfil digital y su edición.
3. Implementar CRUD y orden de enlaces.
4. Publicar perfil por slug único.
5. Asociar identificadores NFC/QR y resolverlos.
6. Generar vCard descargable.
7. Añadir captura de leads con consentimiento, si cabe en el tiempo.
8. Completar dashboard mínimo de cliente y administración.
9. Añadir pruebas y documentación de entrega.

## Capabilities

### New Capabilities
- `integration/session-handling`
- `integration/protected-navigation`
- `ui/responsive-design`

### Modified Capabilities
Ninguna. La autenticación existente se verifica y estabiliza sin reconstruirla.

## Impact
- Contraparte en `backend`: las tareas de ese lado se registran en su propio `tasks.md`.
- Fuera del alcance obligatorio de esta entrega: Pagos Wompi en producción, membresías/cobros recurrentes, facturación DIAN, analítica avanzada, Google Contacts, app nativa y microservicios. Se mantienen como evolución posterior salvo aprobación explícita y capacidad suficiente.

### Criterios de éxito
- Usuario autorizado crea y actualiza su perfil.
- Slug público único y perfil publicado consultable sin login.
- Enlaces se crean, editan, ordenan, activan y eliminan.
- Visitante ve solo campos públicos.
- NFC/QR resuelve al perfil; códigos revocados dejan de funcionar.
- vCard incluye solo datos autorizados.
- Sesión y errores 401/403 funcionan coherentemente.
- Se prueban permisos, aislamiento por usuario/organización y acceso público.
- Backend compila, frontend genera build y existe guía reproducible de ejecución.

### Línea base reportada
### Backend
- NestJS 11, TypeScript, PostgreSQL, TypeORM.
- `add-auth-and-roles`: 37/38 tareas (97,4 % del cambio).
- 24 requisitos, 57 escenarios; 55/55 pruebas unitarias y 103/103 E2E reportadas satisfactorias.
- 25 rutas reportadas.
- Roles `SUPER_ADMIN`, `SOPORTE`, `EMPRESA`, `CLIENTE`.
- Google OAuth real y cierre documental/técnico pendientes.

### Frontend
- Next.js App Router 16.4.0, React 19.3.0, Tailwind 4, shadcn/ui, Axios.
- `auth-frontend-integration`: 57/67 tareas (85,1 %).
- Siete vistas construidas; 0/10 pruebas manuales E2E completadas al corte.
- Defectos reportados: detección de cookie, ciclo/duplicidad de refresh, interceptor 401, convención `proxy.ts`, tipado y limpieza.

Los porcentajes anteriores son históricos y deben revalidarse en el repositorio.

### Backlog posterior al periodo de prácticas
- 8.1 Membresías y ciclo de vida de planes.
- 8.2 Pagos Wompi y validación segura de webhooks.
- 8.3 QR dinámico y cambio de destino.
- 8.4 Analítica de escaneos.
- 8.5 Google People API / exportación Google Contacts.
- 8.6 Almacenamiento definitivo de imágenes.
- 8.7 Reportes y métricas.
- 8.8 Aplicación móvil.
