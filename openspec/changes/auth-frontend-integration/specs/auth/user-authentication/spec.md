# Spec Delta

## Purpose

Proporciona flujos de autenticación de usuario incluyendo registro, login, logout, recuperación de contraseña y verificación de email conectando con los endpoints del backend.

## ADDED Requirements

### Requirement: Usuario puede registrarse con email y contraseña
El sistema SHALL permitir a nuevos usuarios crear una cuenta proporcionando nombre, email y contraseña que cumplan las políticas establecidas.

#### Scenario: Registro exitoso
- **WHEN** el usuario completa el formulario de registro con datos válidos (nombre de 2-120 caracteres, email válido, contraseña de 8-128 caracteres con al menos una letra y un número)
- **THEN** el sistema envía la solicitud al endpoint POST /auth/register y muestra mensaje de verificación de email

#### Scenario: Registro con datos inválidos
- **WHEN** el usuario intenta registrarse con email inválido o contraseña que no cumple la política
- **THEN** el sistema muestra mensajes de error de validación específicos sin enviar la solicitud

#### Scenario: Registro con email duplicado
- **WHEN** el usuario intenta registrarse con un email ya existente
- **THEN** el sistema muestra mensaje de error indicando que el email ya está en uso

### Requirement: Usuario puede verificar su email
El sistema SHALL permitir a usuarios verificar su dirección de email mediante un token recibido por correo.

#### Scenario: Verificación exitosa
- **WHEN** el usuario accede a la URL de verificación con token válido
- **THEN** el sistema envía el token al endpoint POST /auth/verify-email, marca el email como verificado y redirige al login

#### Scenario: Verificación con token inválido o expirado
- **WHEN** el usuario accede a la URL de verificación con token inválido o expirado
- **THEN** el sistema muestra mensaje de error y opción para reenviar verificación

#### Scenario: Usuario puede reenviar email de verificación
- **WHEN** el usuario solicita reenvío del email de verificación con su email
- **THEN** el sistema envía solicitud al endpoint POST /auth/resend-verification y muestra mensaje de confirmación

### Requirement: Usuario puede iniciar sesión
El sistema SHALL autenticar usuarios mediante email y contraseña, y establecer una sesión válida.

#### Scenario: Login exitoso
- **WHEN** el usuario ingresa credenciales válidas
- **THEN** el sistema envía solicitud al endpoint POST /auth/login, almacena el access token y refresh token, guarda información del usuario en contexto, y redirige al dashboard

#### Scenario: Login con credenciales inválidas
- **WHEN** el usuario ingresa email o contraseña incorrectos
- **THEN** el sistema muestra mensaje de error sin revelar cuál dato es incorrecto

#### Scenario: Login con email no verificado
- **WHEN** el usuario intenta iniciar sesión sin haber verificado su email
- **THEN** el sistema muestra mensaje indicando que debe verificar su email y opción para reenviar verificación

### Requirement: Usuario puede cerrar sesión
El sistema SHALL permitir a usuarios cerrar su sesión actual o todas sus sesiones.

#### Scenario: Logout de sesión actual
- **WHEN** el usuario hace clic en logout desde el dropdown de perfil
- **THEN** el sistema envía solicitud al endpoint POST /auth/logout, limpia tokens y estado de autenticación, y redirige al login

#### Scenario: Logout de todas las sesiones
- **WHEN** el usuario selecciona cerrar todas las sesiones
- **THEN** el sistema envía solicitud al endpoint POST /auth/logout-all, limpia tokens locales y redirige al login

### Requirement: Usuario puede recuperar contraseña olvidada
El sistema SHALL permitir a usuarios restablecer su contraseña mediante un token enviado por email.

#### Scenario: Solicitud de recuperación de contraseña
- **WHEN** el usuario ingresa su email en el formulario de recuperación
- **THEN** el sistema envía solicitud al endpoint POST /auth/forgot-password y muestra mensaje de confirmación

#### Scenario: Restablecimiento exitoso de contraseña
- **WHEN** el usuario accede a la URL de restablecimiento con token válido e ingresa nueva contraseña válida
- **THEN** el sistema envía solicitud al endpoint POST /auth/reset-password con token y nueva contraseña, y redirige al login

#### Scenario: Restablecimiento con token inválido
- **WHEN** el usuario intenta restablecer contraseña con token inválido o expirado
- **THEN** el sistema muestra mensaje de error y opción para solicitar nuevo enlace

### Requirement: Usuario puede cambiar contraseña estando autenticado
El sistema SHALL permitir a usuarios autenticados cambiar su contraseña proporcionando la contraseña actual.

#### Scenario: Cambio exitoso de contraseña
- **WHEN** el usuario autenticado ingresa contraseña actual correcta y nueva contraseña válida
- **THEN** el sistema envía solicitud al endpoint POST /auth/change-password, actualiza la contraseña y muestra mensaje de confirmación

#### Scenario: Cambio con contraseña actual incorrecta
- **WHEN** el usuario ingresa contraseña actual incorrecta
- **THEN** el sistema muestra mensaje de error indicando que la contraseña actual es incorrecta

### Requirement: Validación de políticas de contraseña en frontend
El sistema SHALL validar que las contraseñas cumplan las políticas antes de enviar al backend.

#### Scenario: Validación de longitud mínima
- **WHEN** el usuario ingresa una contraseña de menos de 8 caracteres
- **THEN** el sistema muestra mensaje "La contraseña debe tener entre 8 y 128 caracteres"

#### Scenario: Validación de contenido de letra
- **WHEN** el usuario ingresa una contraseña sin letras
- **THEN** el sistema muestra mensaje "La contraseña debe incluir al menos una letra"

#### Scenario: Validación de contenido de número
- **WHEN** el usuario ingresa una contraseña sin números
- **THEN** el sistema muestra mensaje "La contraseña debe incluir al menos un número"
