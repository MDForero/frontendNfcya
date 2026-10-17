# Proposal

## Why

El backend ya implementa un sistema completo de autenticación con endpoints para login, registro, recuperación de contraseña, verificación de email, gestión de sesiones y cambio de contraseña. El frontend actualmente carece de interfaces de usuario para consumir estos endpoints, lo que impide que los usuarios interactúen con el sistema. Se necesita una implementación moderna con buena UX/UI que permita a los usuarios autenticarse y visualizar su información y rol.

## What Changes

- Crear sistema de gestión de estado de autenticación usando React Context API
- Implementar páginas de autenticación (login, registro, recuperación de contraseña, verificación de email, cambio de contraseña) con componentes shadcn/ui
- Desarrollar componente de dropdown de perfil que muestre nombre y rol del usuario
- Implementar middleware de protección de rutas basado en autenticación
- Crear servicio de API HTTP para comunicación con endpoints del backend
- Implementar manejo automático de tokens (access token y refresh token)
- Desarrollar componente de layout con navbar que incluya el dropdown de perfil para usuarios autenticados

## Capabilities

### New Capabilities

- `auth/user-authentication`: Gestión completa del flujo de autenticación incluyendo login, registro, logout, y recuperación de contraseña
- `auth/session-management`: Manejo de sesiones de usuario con tokens JWT, refresh automático, y persistencia del estado de autenticación
- `auth/protected-routes`: Sistema de protección de rutas que restringe acceso basado en el estado de autenticación del usuario
- `ui/user-profile-display`: Componente de interfaz que muestra la información del usuario logueado (nombre y rol) en un dropdown de perfil

### Modified Capabilities

<!-- No se modifican capacidades existentes ya que es un proyecto nuevo -->

## Impact

- **Estructura de archivos**: Nuevos directorios `lib/`, `contexts/`, `components/`, y `app/(auth)/` para organizar la lógica de autenticación
- **Dependencias**: Se agregarán paquetes como `axios` para HTTP, `js-cookie` para manejo de cookies, y componentes de shadcn/ui
- **Rutas**: Nuevas rutas públicas `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/change-password`
- **Layout principal**: Modificación del layout root para incluir el AuthProvider y navbar con dropdown de perfil
- **Backend**: No hay cambios en backend, solo consumo de endpoints existentes
