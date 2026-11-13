# Spec Delta

## Purpose

Protege rutas de la aplicación restringiendo acceso basado en el estado de autenticación del usuario.

## ADDED Requirements

### Requirement: Rutas privadas requieren autenticación
El sistema SHALL restringir acceso a rutas privadas solo a usuarios autenticados.

#### Scenario: Usuario autenticado accede a ruta privada
- **WHEN** un usuario autenticado navega a una ruta privada
- **THEN** el sistema permite el acceso y renderiza el contenido

#### Scenario: Usuario no autenticado intenta acceder a ruta privada
- **WHEN** un usuario no autenticado intenta acceder a ruta privada
- **THEN** el sistema redirige al login preservando la URL destino en query parameter

#### Scenario: Redirección tras login exitoso
- **WHEN** un usuario no autenticado es redirigido al login e inicia sesión exitosamente
- **THEN** el sistema redirige automáticamente a la URL destino original

### Requirement: Rutas públicas accesibles sin autenticación
El sistema SHALL permitir acceso a rutas de autenticación (login, registro, recuperación) sin requerir sesión activa.

#### Scenario: Usuario no autenticado accede a login
- **WHEN** un usuario no autenticado navega a /login
- **THEN** el sistema muestra la página de login sin redirecciones

#### Scenario: Usuario autenticado accede a login
- **WHEN** un usuario ya autenticado intenta acceder a /login
- **THEN** el sistema redirige al dashboard o página principal

### Requirement: Protección implementada mediante middleware o componente
El sistema SHALL verificar autenticación antes de renderizar componentes de rutas privadas.

#### Scenario: Verificación durante carga inicial
- **WHEN** el usuario accede directamente a una ruta privada mediante URL
- **THEN** el sistema espera a verificar la sesión antes de renderizar o redirigir

#### Scenario: Verificación durante navegación cliente
- **WHEN** el usuario autenticado navega entre rutas mediante navegación cliente
- **THEN** el sistema verifica autenticación sin recargar la página

### Requirement: Loading state durante verificación de ruta
El sistema SHALL mostrar indicador de carga mientras verifica autenticación para rutas privadas.

#### Scenario: Loading durante verificación inicial
- **WHEN** el usuario accede a ruta privada y la sesión aún está siendo verificada
- **THEN** muestra spinner o skeleton hasta completar verificación

#### Scenario: Sin flicker en rutas protegidas
- **WHEN** el usuario autenticado navega a ruta privada con sesión ya verificada
- **THEN** renderiza el contenido inmediatamente sin mostrar loading innecesario
