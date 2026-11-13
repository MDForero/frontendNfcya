# Spec Delta

## Purpose

Protección de la navegación en el cliente; la autorización final es del backend.

## ADDED Requirements

### Requirement: Navegación protegida
El frontend MUST proteger experiencia de navegación, pero el backend conserva autoridad final de autorización.

#### Scenario: Navegación sin sesión
- **GIVEN** usuario sin sesión
- **WHEN** navega a una ruta privada
- **THEN** el frontend lo lleva al login y la API sigue rechazando las peticiones sin token válido

### Requirement: Administración de usuarios por rol
La sección Administración MUST ofrecer las pestañas Perfiles y Usuarios a `SUPER_ADMIN`, `SOPORTE` y `EMPRESA` (acotado a su organización), mostrando solo las acciones que cada rol puede ejecutar. Crear administradores y eliminar usuarios MUST estar disponible solo para `SUPER_ADMIN`, y eliminar MUST exigir escribir el email del usuario.

#### Scenario: Acciones según el rol
- **GIVEN** un usuario con rol administrativo
- **WHEN** abre `/admin/users`
- **THEN** ve solo las acciones de su rol; un `CLIENTE` ve el aviso de sin permisos y la API sigue validando cada acción
