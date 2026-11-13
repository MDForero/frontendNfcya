# integration/session-handling Specification

## Purpose
Manejo de la sesión del frontend contra la API: renovación del token de acceso, expiración y cierre de sesión.

## Requirements

### Requirement: Sesión
El frontend MUST restaurar sesión válida y manejar expiración sin refresh duplicado.

#### Scenario: Login inválido
- **GIVEN** credenciales incorrectas
- **WHEN** API responde 401
- **THEN** se muestra error de login y no se ejecuta refresh automático

#### Scenario: Refresh inválido
- **GIVEN** refresh expirado/revocado
- **WHEN** se intenta renovar
- **THEN** se limpia estado y se redirige una sola vez
