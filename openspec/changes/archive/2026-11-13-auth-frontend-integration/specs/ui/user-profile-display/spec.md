# Spec Delta

## Purpose

Muestra información del usuario autenticado (nombre y rol) en un dropdown de perfil accesible desde el navbar.

## ADDED Requirements

### Requirement: Dropdown de perfil visible para usuarios autenticados
El sistema SHALL mostrar un componente dropdown en el navbar que muestra nombre y rol del usuario autenticado.

#### Scenario: Dropdown visible cuando usuario está autenticado
- **WHEN** un usuario autenticado navega por la aplicación
- **THEN** el navbar muestra el dropdown de perfil con avatar o iniciales del nombre

#### Scenario: Dropdown no visible para usuarios no autenticados
- **WHEN** un usuario no autenticado accede a páginas públicas
- **THEN** el navbar no muestra el dropdown de perfil

### Requirement: Información de usuario mostrada en dropdown
El sistema SHALL mostrar nombre completo y rol del usuario en el contenido del dropdown.

#### Scenario: Contenido del dropdown
- **WHEN** el usuario hace clic en el trigger del dropdown
- **THEN** se despliega panel mostrando nombre completo, email y rol formateado (CLIENTE → Cliente, EMPRESA → Empresa, SOPORTE → Soporte, SUPER_ADMIN → Super Admin)

#### Scenario: Avatar con iniciales
- **WHEN** el dropdown está cerrado
- **THEN** muestra avatar circular con las iniciales del nombre del usuario

### Requirement: Opciones de navegación en dropdown
El sistema SHALL incluir opciones de navegación y acciones en el dropdown de perfil.

#### Scenario: Opciones disponibles en dropdown
- **WHEN** el usuario abre el dropdown de perfil
- **THEN** muestra opciones: "Perfil", "Cambiar contraseña", "Cerrar sesión", "Cerrar todas las sesiones"

#### Scenario: Navegación a cambiar contraseña
- **WHEN** el usuario selecciona "Cambiar contraseña" del dropdown
- **THEN** navega a /change-password

#### Scenario: Acción de logout desde dropdown
- **WHEN** el usuario selecciona "Cerrar sesión"
- **THEN** ejecuta el logout de la sesión actual

#### Scenario: Acción de logout all desde dropdown
- **WHEN** el usuario selecciona "Cerrar todas las sesiones"
- **THEN** ejecuta el logout de todas las sesiones del usuario

### Requirement: Diseño moderno con shadcn/ui
El sistema SHALL implementar el dropdown usando componentes de shadcn/ui con diseño moderno.

#### Scenario: Componente shadcn DropdownMenu
- **WHEN** se implementa el dropdown de perfil
- **THEN** utiliza componente DropdownMenu de shadcn/ui con estilos consistentes

#### Scenario: Componente shadcn Avatar
- **WHEN** se muestra el trigger del dropdown
- **THEN** utiliza componente Avatar de shadcn/ui para mostrar iniciales

#### Scenario: Responsive en móvil
- **WHEN** el usuario accede desde dispositivo móvil
- **THEN** el dropdown de perfil es completamente funcional y bien posicionado

### Requirement: Visual feedback de roles
El sistema SHALL diferenciar visualmente roles mediante badge o indicador de color.

#### Scenario: Badge de rol en dropdown
- **WHEN** el dropdown está abierto
- **THEN** muestra el rol con badge que tiene color distintivo según el rol

#### Scenario: Colores por rol
- **WHEN** se muestra el badge de rol
- **THEN** utiliza colores: CLIENTE (azul), EMPRESA (verde), SOPORTE (naranja), SUPER_ADMIN (rojo)
