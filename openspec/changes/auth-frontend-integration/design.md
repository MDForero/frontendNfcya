# Design

## Context

El frontend es una aplicación Next.js 16.4 (App Router) con Tailwind CSS 4. El backend expone endpoints REST en `/auth` que manejan autenticación mediante JWT (access token de corta duración en response body + refresh token de larga duración en cookie httpOnly). No existe actualmente ningún sistema de gestión de estado ni componentes de UI para autenticación.

Los endpoints relevantes del backend son:
- POST /auth/register, /auth/verify-email, /auth/resend-verification
- POST /auth/login, /auth/refresh, /auth/logout, /auth/logout-all
- POST /auth/forgot-password, /auth/reset-password, /auth/change-password

El backend retorna `{ accessToken, tokenType: 'Bearer', expiresIn, user: { id, name, email, role, status } }` en login/refresh. Los roles son: CLIENTE, EMPRESA, SOPORTE, SUPER_ADMIN.

## Goals / Non-Goals

**Goals:**
- Sistema de autenticación completo y funcional conectado con backend existente
- UX moderna con componentes shadcn/ui y diseño responsive
- Manejo robusto de tokens con refresh automático y persistencia de sesión
- Protección de rutas con redirección inteligente
- Visualización clara del usuario autenticado y su rol

**Non-Goals:**
- Autenticación OAuth (existe Google OAuth en backend pero se implementará en change separado)
- Gestión de permisos granulares (solo autenticación básica + roles)
- Internacionalización (se implementa en español directamente)
- Tests automatizados (se implementarán después del MVP)

## Decisions

### 1. Context API para gestión de estado de autenticación

**Decisión:** Usar React Context API con hook personalizado `useAuth()`.

**Razones:**
- La autenticación es estado global que muchos componentes necesitan acceder
- Context API es nativa de React, sin dependencias extra
- Suficiente para las necesidades del proyecto (no se requiere Redux/Zustand)
- Pattern familiar para el equipo

**Alternativas consideradas:**
- Zustand: Más ligero pero innecesario para un solo slice de estado global
- Redux Toolkit: Sobrecarga excesiva para caso de uso simple
- Server Components con cookies: No permite interactividad en componentes cliente

**Implementación:**
- `AuthContext` exporta: `{ user, isAuthenticated, isLoading, login, logout, logoutAll, updateUser }`
- `AuthProvider` en layout root, inicializa sesión con refresh automático en mount
- Hook `useAuth()` para consumir el contexto con validación

### 2. Axios para cliente HTTP

**Decisión:** Usar axios con interceptores para manejo de tokens.

**Razones:**
- Interceptores permiten agregar Authorization header automáticamente
- Interceptor de respuesta puede manejar refresh automático en 401
- API más simple que fetch para casos complejos
- Manejo de errores más consistente

**Alternativas consideradas:**
- fetch nativo: Requiere wrapper manual para agregar headers y manejo 401
- ky: Menos features que axios para nuestro caso de uso
- TanStack Query: Buena opción pero agrega complejidad innecesaria

**Implementación:**
- Servicio `lib/api/client.ts` con instancia axios configurada
- Interceptor request: agrega `Authorization: Bearer {token}` si existe
- Interceptor response: detecta 401 → intenta refresh → reintenta request original o redirige a login
- Servicios específicos en `lib/api/auth.ts` para endpoints de autenticación

### 3. shadcn/ui para componentes

**Decisión:** Usar shadcn/ui para todos los componentes de UI.

**Razones:**
- Cumple requisito explícito del proyecto
- Componentes accesibles y customizables
- Copy-paste permite ajustes específicos sin dependencia rígida
- Excelente integración con Tailwind CSS 4

**Componentes requeridos:**
- Button, Input, Label, Card para formularios
- DropdownMenu, Avatar, Badge para perfil de usuario
- Alert para mensajes de error/éxito
- Spinner o Skeleton para loading states

### 4. Protección de rutas con middleware de Next.js

**Decisión:** Usar middleware de Next.js 15+ en `middleware.ts` para protección de rutas.

**Razones:**
- Ejecuta antes de renderizar, evita flash de contenido no autorizado
- Acceso directo a cookies (refresh token)
- Puede hacer refresh de token server-side antes de renderizar
- Redirección más eficiente que con componentes cliente

**Alternativas consideradas:**
- HOC de protección: Causa flash de contenido y múltiples renders
- Server Components verificando cookies: No permite interactividad
- useEffect en componentes: Peor UX, flash visible

**Implementación:**
- `middleware.ts` verifica rutas que empiezan con /dashboard, /admin, etc.
- Lee refresh token de cookie, lo valida (o intenta refresh)
- Si válido: permite acceso
- Si inválido: redirige a `/login?callbackUrl={current}`
- Rutas públicas (`/login`, `/register`, etc.) permiten acceso siempre

### 5. Estructura de directorios

**Decisión:** Organizar código en:
```
app/
  (auth)/          # Route group para páginas públicas de auth
    login/
    register/
    forgot-password/
    reset-password/
    verify-email/
  (protected)/     # Route group para rutas protegidas
    dashboard/
    change-password/
  layout.js        # Root layout con AuthProvider
contexts/
  auth-context.tsx # AuthContext y AuthProvider
components/
  ui/              # shadcn/ui components
  auth/            # Componentes específicos de auth
  layout/          # Navbar, ProfileDropdown
lib/
  api/
    client.ts      # Axios instance
    auth.ts        # Auth API calls
  utils/           # Helpers (formatRole, getInitials, etc.)
```

**Razones:**
- Route groups `(auth)` y `(protected)` organizan rutas sin afectar URLs
- Separación clara entre lógica (contexts/lib) y UI (components)
- Sigue convenciones de Next.js App Router
- Fácil localizar archivos relacionados

### 6. Manejo de refresh token automático

**Decisión:** Implementar refresh automático en dos niveles:
1. Interceptor axios: refresh on 401 response
2. AuthProvider: refresh proactivo antes de expiración (5 min antes)

**Razones:**
- Dos capas de seguridad evitan interrupciones de sesión
- Refresh proactivo mejora UX (sin delays por 401)
- Interceptor maneja casos edge donde el proactivo falló

**Implementación:**
- `AuthProvider` inicia timer cuando carga access token
- Timer calcula `expiresIn - 5min` y programa refresh
- En 401, interceptor llama `POST /auth/refresh`
- Si refresh falla (404/401), limpia estado y redirige a login
- Cookie httpOnly manejada automáticamente por navegador

## Risks / Trade-offs

**[Risk]** Refresh token en cookie httpOnly no accesible desde JS → **Mitigation:** Es intencional para seguridad. El backend lo maneja automáticamente.

**[Risk]** Race conditions en múltiples requests simultáneos causando múltiples refresh → **Mitigation:** Implementar promise caching en interceptor: primero request que necesita refresh crea promise, subsiguientes esperan misma promise.

**[Risk]** Usuario edita localStorage/state manualmente → **Mitigation:** Backend siempre valida token. Estado local es solo UI, autorización real es server-side.

**[Risk]** Flash de contenido en rutas protegidas durante verificación inicial → **Mitigation:** Middleware verifica antes de renderizar. AuthProvider muestra loading durante inicialización.

**[Trade-off]** Context API re-renderiza todos consumidores al cambiar user → **Mitigation:** Aceptable porque pocos componentes consumen auth state. Si crece, considerar Context splitting.

**[Trade-off]** Middleware agrega latencia en cada navegación → **Mitigation:** Middleware solo verifica cookie, muy rápido. Solo hace refresh si token está por expirar.

## Migration Plan

**Deployment:**
1. Instalar dependencias: `npm install axios js-cookie`
2. Configurar shadcn/ui: `npx shadcn@latest init`
3. Instalar componentes shadcn requeridos
4. Implementar archivos en orden: lib/api → contexts → components → pages
5. Actualizar layout root con AuthProvider
6. Crear middleware.ts
7. Verificar variables de entorno (NEXT_PUBLIC_API_URL para backend)
8. Build y deploy

**Rollback:**
- Si falla: simplemente no incluir AuthProvider en layout
- Backend no se modifica, rollback solo afecta frontend
- No hay migraciones de base de datos

**Verificación:**
- Probar cada flujo: registro → verificación → login → navegación → logout
- Verificar refresh automático esperando expiración de token
- Probar rutas protegidas sin autenticación
- Verificar responsive en móvil y desktop

## Open Questions

- ¿Qué rutas específicas estarán protegidas además de /dashboard? (Se puede definir durante implementación según surjan páginas)
- ¿Diseño específico de páginas de auth o seguir estilo estándar? (Se puede ajustar en revisión de UI)
