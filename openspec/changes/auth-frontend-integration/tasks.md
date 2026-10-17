# Tasks

## 1. Setup y configuración inicial

- [x] 1.1 Instalar dependencias axios y js-cookie mediante `npm install axios js-cookie` y verificar que aparecen en package.json
- [x] 1.2 Inicializar shadcn/ui con `npx shadcn@latest init` y verificar que se crean archivos de configuración en components/ui
- [x] 1.3 Instalar componentes shadcn/ui necesarios: `npx shadcn@latest add button input label card dropdown-menu avatar badge alert` y verificar que los archivos se crean en components/ui
- [x] 1.4 Crear archivo .env.local con variable NEXT_PUBLIC_API_URL apuntando al backend y verificar que la variable está disponible en process.env

## 2. Servicios de API y cliente HTTP

- [x] 2.1 Crear lib/api/client.ts con instancia axios configurada (baseURL, withCredentials) y verificar que exporta la instancia
- [x] 2.2 Implementar interceptor de request en client.ts que agrega Authorization header cuando existe token y verificar mediante console.log que el header se agrega
- [x] 2.3 Implementar interceptor de response en client.ts con lógica de refresh automático en 401 y promise caching para evitar race conditions, verificar mediante prueba manual con token expirado
- [x] 2.4 Crear lib/api/auth.ts con funciones para todos los endpoints (register, login, logout, refresh, etc.) y verificar que cada función retorna el tipo correcto
- [x] 2.5 Crear lib/utils/auth-helpers.ts con funciones auxiliares (formatRole, getInitials, getRoleBadgeColor) y verificar con ejemplos que retornan valores correctos

## 3. Context de autenticación

- [x] 3.1 Crear contexts/auth-context.tsx con AuthContext, tipos TypeScript (User, AuthContextType), y estructura básica, verificar que compila sin errores
- [x] 3.2 Implementar AuthProvider con estado (user, isAuthenticated, isLoading) y verificar que el estado inicial es correcto
- [x] 3.3 Implementar función login en AuthProvider que llama al API, almacena token y user, y verifica funcionamiento con console.log
- [x] 3.4 Implementar funciones logout y logoutAll en AuthProvider que limpian estado y llaman endpoints correspondientes, verificar que el estado se limpia
- [x] 3.5 Implementar lógica de inicialización en useEffect que intenta refresh al montar AuthProvider y verificar que restaura sesión existente
- [x] 3.6 Implementar refresh automático proactivo con timer (5 min antes de expiración) y verificar con console.log que se ejecuta en el momento correcto
- [x] 3.7 Crear hook personalizado useAuth() que valida el contexto y verificar que lanza error cuando se usa fuera de AuthProvider

## 4. Middleware de protección de rutas

- [x] 4.1 Crear middleware.ts en raíz del proyecto con lógica de verificación de autenticación y verificar que se ejecuta en cada navegación
- [x] 4.2 Implementar matcher config que protege rutas /dashboard, /change-password, y otras rutas privadas, y verificar que solo aplica a esas rutas
- [x] 4.3 Implementar lógica de redirección a login con callbackUrl preservando URL destino y verificar navegando a ruta protegida sin autenticación
- [x] 4.4 Implementar lógica que redirige de rutas auth (/login, /register) al dashboard si usuario ya está autenticado y verificar funcionamiento

## 5. Componentes de layout y navegación

- [x] 5.1 Crear components/layout/navbar.tsx con estructura básica del navbar responsive y verificar que se renderiza correctamente
- [x] 5.2 Crear components/layout/profile-dropdown.tsx usando DropdownMenu, Avatar y Badge de shadcn/ui y verificar que se despliega correctamente
- [x] 5.3 Implementar lógica en ProfileDropdown para mostrar nombre, email, rol con badge de color según rol, y verificar que muestra datos correctos del usuario
- [x] 5.4 Implementar opciones del dropdown (Perfil, Cambiar contraseña, Cerrar sesión, Cerrar todas las sesiones) con navegación y acciones correspondientes, verificar que cada opción funciona
- [x] 5.5 Integrar Navbar en app/layout.js mostrándolo solo cuando usuario está autenticado usando useAuth() y verificar visibilidad condicional

## 6. Páginas de autenticación - Login y Registro

- [x] 6.1 Crear estructura de route group app/(auth) y verificar que no afecta las URLs
- [x] 6.2 Crear app/(auth)/login/page.tsx con formulario de login usando componentes shadcn/ui (Input, Button, Card) y verificar renderizado
- [x] 6.3 Implementar validación de formulario de login (email válido, password requerido) con react-hook-form o validación manual y verificar mensajes de error
- [x] 6.4 Conectar formulario de login con función login del AuthContext y verificar que redirige tras login exitoso
- [x] 6.5 Implementar manejo de errores en login mostrando mensajes apropiados (credenciales inválidas, email no verificado) y verificar cada caso
- [x] 6.6 Crear app/(auth)/register/page.tsx con formulario de registro (nombre, email, password) y verificar renderizado
- [x] 6.7 Implementar validación de password según políticas (8-128 caracteres, letra, número) mostrando mensajes específicos y verificar validación
- [x] 6.8 Conectar formulario de registro con API y mostrar mensaje de verificación tras registro exitoso, verificar flujo completo
- [x] 6.9 Implementar manejo de errores en registro (email duplicado, validación backend) y verificar mensajes

## 7. Páginas de autenticación - Verificación y recuperación

- [x] 7.1 Crear app/(auth)/verify-email/page.tsx que lee token de query params y llama endpoint de verificación, verificar con URL de prueba
- [x] 7.2 Implementar UI de estados en verify-email (loading, éxito, error) y opción de reenvío, verificar cada estado
- [x] 7.3 Crear app/(auth)/forgot-password/page.tsx con formulario de email y verificar envío de solicitud
- [x] 7.4 Implementar mensajes de confirmación en forgot-password y manejo de errores, verificar funcionamiento
- [x] 7.5 Crear app/(auth)/reset-password/page.tsx que lee token de query params y muestra formulario de nueva contraseña, verificar con URL de prueba
- [x] 7.6 Implementar validación de password y conexión con API en reset-password, verificar flujo completo desde forgot-password
- [x] 7.7 Implementar manejo de errores (token inválido/expirado) con opción de solicitar nuevo enlace y verificar casos de error

## 8. Página de cambio de contraseña protegida

- [x] 8.1 Crear estructura de route group app/(protected) y verificar que no afecta las URLs
- [x] 8.2 Crear app/(protected)/change-password/page.tsx con formulario (contraseña actual, nueva contraseña, confirmar) y verificar renderizado
- [x] 8.3 Implementar validación de formulario (contraseña actual requerida, nueva contraseña cumple políticas, confirmación coincide) y verificar validación
- [x] 8.4 Conectar formulario con endpoint POST /auth/change-password y verificar funcionamiento con credenciales correctas
- [x] 8.5 Implementar manejo de errores (contraseña actual incorrecta) y mensaje de éxito tras cambio, verificar ambos casos

## 9. Página dashboard de ejemplo

- [x] 9.1 Crear app/(protected)/dashboard/page.tsx con contenido básico de dashboard y verificar que solo es accesible autenticado
- [x] 9.2 Mostrar información del usuario (nombre, email, rol) en dashboard usando useAuth() y verificar que muestra datos correctos
- [x] 9.3 Implementar loading state en dashboard mientras se verifica sesión inicial y verificar que no hay flash de contenido

## 10. Integración del AuthProvider en layout root

- [x] 10.1 Modificar app/layout.js para convertirlo en client component si es necesario y envolver children con AuthProvider, verificar que la app carga sin errores
- [x] 10.2 Verificar que el AuthProvider se inicializa correctamente al cargar la aplicación intentando refresh si existe cookie, observar comportamiento en DevTools
- [x] 10.3 Implementar loading state global durante inicialización del AuthProvider para evitar flash, verificar UX durante carga inicial

## 11. Estilos y responsive design

- [x] 11.1 Aplicar estilos Tailwind CSS a todas las páginas de autenticación asegurando diseño moderno y limpio, verificar visualmente cada página
- [x] 11.2 Verificar responsive design de navbar y profile dropdown en viewport móvil (< 768px) y verificar que funciona correctamente
- [x] 11.3 Verificar responsive design de formularios de autenticación en móvil y tablet, ajustar si es necesario
- [x] 11.4 Implementar estados hover, focus y disabled apropiados en todos los botones e inputs, verificar interactividad
- [x] 11.5 Asegurar accesibilidad básica (labels asociados, focus visible, navegación por teclado) y verificar con Tab y Enter

## 12. Testing manual y verificación de flujos completos

- [ ] 12.1 Probar flujo completo: registro → email de verificación → login → navegación a dashboard, verificar que funciona end-to-end
- [ ] 12.2 Probar flujo de recuperación: forgot-password → email con token → reset-password → login, verificar funcionamiento
- [ ] 12.3 Probar cambio de contraseña estando autenticado y verificar que se actualiza correctamente
- [ ] 12.4 Verificar que rutas protegidas redirigen a login cuando no hay autenticación y restauran URL destino tras login
- [ ] 12.5 Verificar que refresh automático funciona dejando sesión activa sin interacción durante tiempo cercano a expiración
- [ ] 12.6 Probar logout desde dropdown de perfil y verificar que limpia sesión y redirige a login
- [ ] 12.7 Probar logout all y verificar que invalida todas las sesiones
- [ ] 12.8 Verificar manejo de errores de red y timeouts mostrando mensajes apropiados
- [ ] 12.9 Verificar que el badge de rol muestra color correcto para cada tipo de usuario (CLIENTE, EMPRESA, SOPORTE, SUPER_ADMIN)
- [ ] 12.10 Probar navegación entre rutas protegidas estando autenticado y verificar que no hay re-autenticaciones innecesarias
