# Spec Delta

## Purpose

Gestiona el ciclo de vida de sesiones de usuario con tokens JWT, refresh automático de tokens y persistencia del estado de autenticación.

## ADDED Requirements

### Requirement: Sistema mantiene sesión con access token
El sistema SHALL almacenar el access token JWT recibido del backend y utilizarlo para autenticar peticiones HTTP.

#### Scenario: Token incluido en peticiones autenticadas
- **WHEN** el sistema realiza una petición HTTP a un endpoint protegido
- **THEN** incluye el access token en el header Authorization con formato "Bearer {token}"

#### Scenario: Token almacenado en memoria
- **WHEN** el usuario inicia sesión exitosamente
- **THEN** el sistema almacena el access token en memoria a través del AuthContext

### Requirement: Sistema refresca automáticamente tokens expirados
El sistema SHALL renovar automáticamente el access token antes de que expire usando el refresh token almacenado en cookie httpOnly.

#### Scenario: Refresh exitoso antes de expiración
- **WHEN** el access token está próximo a expirar (dentro de 5 minutos)
- **THEN** el sistema envía solicitud al endpoint POST /auth/refresh, obtiene nuevo access token y actualiza el contexto

#### Scenario: Refresh automático tras error 401
- **WHEN** una petición HTTP retorna status 401 Unauthorized
- **THEN** el sistema intenta refrescar el token mediante POST /auth/refresh y reintenta la petición original

#### Scenario: Refresh fallido
- **WHEN** la solicitud de refresh retorna error (refresh token inválido o expirado)
- **THEN** el sistema limpia el estado de autenticación, elimina tokens y redirige al login

### Requirement: Refresh token se gestiona mediante cookie httpOnly
El sistema SHALL almacenar el refresh token en cookie httpOnly manejada automáticamente por el navegador.

#### Scenario: Cookie establecida en login
- **WHEN** el usuario inicia sesión exitosamente
- **THEN** el backend establece cookie httpOnly con refresh token que el navegador almacena automáticamente

#### Scenario: Cookie enviada en peticiones refresh
- **WHEN** el sistema envía solicitud POST /auth/refresh
- **THEN** el navegador incluye automáticamente la cookie con refresh token sin intervención de JavaScript

#### Scenario: Cookie limpiada en logout
- **WHEN** el usuario cierra sesión
- **THEN** el sistema envía solicitud POST /auth/logout que invalida el refresh token y limpia la cookie

### Requirement: Estado de autenticación persiste entre recargas
El sistema SHALL mantener la sesión del usuario al recargar la página o navegar entre rutas.

#### Scenario: Restauración de sesión en carga inicial
- **WHEN** el usuario recarga la página y existe cookie de refresh token válida
- **THEN** el sistema automáticamente obtiene nuevo access token mediante POST /auth/refresh y restaura el estado del usuario

#### Scenario: Sin sesión al cargar sin cookie válida
- **WHEN** el usuario carga la aplicación sin cookie de refresh token válida
- **THEN** el sistema inicia en estado no autenticado sin intentar refresh

### Requirement: Información de usuario se almacena en contexto
El sistema SHALL mantener información del usuario autenticado (id, nombre, email, rol, status) accesible globalmente.

#### Scenario: Usuario cargado tras login
- **WHEN** el login retorna respuesta exitosa con objeto user
- **THEN** el sistema almacena todos los campos del usuario en AuthContext

#### Scenario: Usuario accesible en componentes
- **WHEN** un componente necesita información del usuario autenticado
- **THEN** puede acceder a los datos mediante el hook useAuth sin hacer petición adicional

### Requirement: Sistema maneja expiración de sesión
El sistema SHALL detectar cuando una sesión expira y limpiar el estado apropiadamente.

#### Scenario: Detección de sesión expirada
- **WHEN** el refresh token expira y POST /auth/refresh retorna error
- **THEN** el sistema limpia estado de autenticación y muestra mensaje indicando que la sesión expiró

#### Scenario: Redirección tras expiración
- **WHEN** el sistema detecta sesión expirada mientras el usuario navega
- **THEN** redirige al login preservando la URL destino para redirigir tras nuevo login

### Requirement: Loading state durante operaciones de sesión
El sistema SHALL indicar estados de carga durante inicialización y operaciones de autenticación.

#### Scenario: Loading durante inicialización
- **WHEN** la aplicación carga y verifica sesión existente
- **THEN** muestra estado de loading hasta completar verificación o timeout

#### Scenario: Loading durante operaciones de auth
- **WHEN** el usuario realiza login, logout o cualquier operación de autenticación
- **THEN** el estado isLoading en AuthContext es true hasta completar la operación
