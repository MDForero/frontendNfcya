# Design: decisiones técnicas y modelo de dominio

## Arquitectura
Mantener NestJS modular y Next.js como cliente web. Reutilizar módulos existentes (`auth`, `users`, `organizations`, `admin`, `audit`, `mail`). Añadir módulos solo donde haya responsabilidad diferenciada: `profiles`, `profile-links`, `nfc-qr`, `leads`. No crear módulos innecesarios.

## Modelo sugerido
Los nombres son conceptuales; contrastar con entidades reales antes de migrar.

### Profile
- `id` UUID; `ownerUserId`; `organizationId` nullable según tipo.
- `slug` único normalizado.
- `displayName`, `headline`, `bio`, `avatarUrl`, `coverUrl`.
- `phone`, `email`, `website`, `locationLabel` opcionales.
- `theme` validado contra opciones permitidas.
- `visibility`: `PRIVATE`, `UNLISTED`, `PUBLIC` si aplica.
- `status`: `DRAFT`, `PUBLISHED`, `SUSPENDED`.
- timestamps y `publishedAt`.

### ProfileLink
- `id`, `profileId`, `label`, `url`, `type`, `sortOrder`, `isActive`, timestamps.
- Tipos controlados: `WEBSITE`, `INSTAGRAM`, `FACEBOOK`, `LINKEDIN`, `WHATSAPP`, `YOUTUBE`, `TIKTOK`, `OTHER`.

### ProfileIdentifier
- `id`, `profileId`, `kind` (`NFC`/`QR`), `publicCode` aleatorio opaco y único.
- `mode` (`STATIC`/`DYNAMIC`) solo si se implementa.
- `status` (`ACTIVE`/`INACTIVE`/`REVOKED`), timestamps y `revokedAt`.

### Lead (P1)
- `id`, `profileId`, `name`, `email`, `phone`, `message`.
- `consentAccepted`, `source`, `createdAt`.
- Política de retención y acceso restringido obligatorios.

## Slug y publicación
- Minúsculas, sin espacios, caracteres seguros; unicidad garantizada en BD.
- No codificar dominio productivo hasta confirmación empresarial.
- Perfiles en borrador, privados o suspendidos no son públicos.
- Respuesta pública mediante DTO explícito; no serializar entidad TypeORM.

## Seguridad y privacidad
- Validar DTOs, longitudes, tipos y URLs.
- Bloquear esquemas `javascript:`, `data:` y similares; permitir solo protocolos aprobados.
- Limitar número de enlaces, tamaño de biografía y peticiones públicas.
- Evitar XSS; no renderizar HTML arbitrario.
- Tokens públicos no secuenciales, aleatorios y con entropía suficiente.
- Aplicar rate limit a resolución de códigos y captura de leads.
- No registrar tokens, contraseñas ni datos sensibles.
- Consentimiento explícito antes de almacenar datos personales.
- Verificar propiedad de recurso en cada operación de escritura (evitar IDOR).

## Contratos API orientativos
Estos paths son propuestas, no rutas confirmadas. Inspeccionar prefijo global, versionado y convenciones existentes.

| Método | Ruta sugerida | Función | Acceso |
|---|---|---|---|
| GET | `/profiles/me` | Obtener perfil propio | Autenticado |
| POST | `/profiles` | Crear perfil | Autenticado |
| PATCH | `/profiles/me` | Actualizar perfil | Autenticado |
| GET | `/profiles/slug-availability?slug=` | Disponibilidad slug | Autenticado |
| GET | `/profiles/public/:slug` | Consultar perfil público | Público |
| POST | `/profiles/me/links` | Crear enlace | Autenticado |
| PATCH | `/profiles/me/links/:id` | Editar enlace | Autenticado |
| DELETE | `/profiles/me/links/:id` | Eliminar enlace | Autenticado |
| PATCH | `/profiles/me/links/reorder` | Reordenar | Autenticado |
| POST | `/profiles/me/publish` | Publicar | Autenticado |
| POST | `/profiles/me/unpublish` | Despublicar | Autenticado |
| POST | `/profiles/me/identifiers` | Crear NFC/QR | Autenticado |
| GET | `/profiles/me/identifiers` | Listar NFC/QR | Autenticado |
| PATCH | `/profiles/me/identifiers/:id/status` | Cambiar estado | Autenticado |
| GET | `/resolve/:code` | Resolver identificador | Público |
| GET | `/profiles/public/:slug/vcard` | Descargar vCard | Público |
| POST | `/profiles/public/:slug/leads` | Crear lead | Público + rate limit |
| GET | `/admin/profiles` | Listar perfiles | Admin |

## NFC y QR
Flujo mínimo: crear código opaco → formar URL HTTPS → grabar URL en chip/imprimir QR → visitante abre URL → se resuelve perfil. Revocar/desactivar impide nuevas resoluciones. No es obligatorio escribir físicamente el chip desde backend. QR estático basta para primera entrega; QR dinámico queda posterior si el tiempo no alcanza.

## vCard
Generar `.vcf` a partir de campos públicos, escapar caracteres especiales y saltos de línea, configurar MIME y nombre de archivo, probar acentos y caracteres especiales.

## Pruebas
Unitarias para servicios/validadores/slug/vCard; E2E para CRUD/publicación/consulta/roles/revocación; casos de acceso cruzado; frontend para estados, errores y navegación; pruebas reales en móvil para URL, QR y vCard.

## Priorización por fecha
El periodo de prácticas termina el 27 de noviembre de 2026. Al 9 de noviembre queda un periodo corto. Orden recomendado:
- P0: estabilizar autenticación/integración; perfil propio; enlaces; perfil público; resolución básica NFC/QR.
- P1: vCard; panel administrativo mínimo; captura básica de leads con consentimiento.
- P2/fase posterior: QR dinámico avanzado, analítica, membresías, pagos Wompi, Google Contacts, DIAN, app móvil.

No sacrificar seguridad ni pruebas para aumentar el porcentaje de tareas.

## Reglas de arquitectura y negocio
- Mantener monolito modular NestJS.
- Backend es autoridad para autenticación, autorización y propiedad de recursos.
- `CLIENTE` administra solo su perfil; `EMPRESA` solo recursos de su organización según reglas aprobadas; `SOPORTE` y `SUPER_ADMIN` conservan las policies actuales.
- No confiar en `ownerUserId` ni `organizationId` enviados por el cliente: derivarlos del usuario autenticado y validar permisos.
- Perfiles públicos devuelven DTO de lista permitida, nunca entidades completas.
- El chip NFC almacena solo una URL HTTPS, no datos personales.
- No incluir secretos ni datos personales en logs.
