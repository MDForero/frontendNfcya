# Guion de demostración (tarea 7.9)

Solo incluye funcionalidades verificadas (ver `evidence.md`). Duración: unos 15 minutos.

## Preparación (una vez)

```bash
# backend
pnpm migration:run
BOOTSTRAP_ADMIN_EMAIL=admin@demo.nfcya.test BOOTSTRAP_ADMIN_PASSWORD='<clave>' pnpm seed:admin
DEMO_PASSWORD='<clave-demo>' pnpm seed:demo     # imprime las URLs de perfiles y códigos
pnpm start:dev
# frontend
pnpm dev
```

`seed:demo` crea (idempotente; se niega a correr con `NODE_ENV=production`):

| Cuenta | Rol | Qué tiene |
|---|---|---|
| `ana@demo.nfcya.test` | CLIENTE (org. NFCya Demo SAS) | Perfil publicado `ana-gomez-demo` (tema Océano), 3 enlaces visibles y 1 oculto, código NFC y QR, captura de contactos activa y un lead de ejemplo |
| `empresa@demo.nfcya.test` | EMPRESA | Perfil publicado `nfcya-demo-sas` y código QR |
| `luis@demo.nfcya.test` | CLIENTE (sin org.) | Perfil en **borrador** `luis-perez-demo` |
| `soporte@demo.nfcya.test` | SOPORTE | — |

Antes de empezar, ten en el móvil la URL del QR de Ana (o el QR descargado de `/nfc-qr`). Si hay chip NFC, grábale la URL del código NFC (README → «Perfil público y NFC»). En el móvil la URL debe ser accesible desde la red (IP del equipo o túnel HTTPS), no `localhost`.

## Recorrido

1. **El problema y la idea** (1 min): una tarjeta física con NFC/QR que abre un perfil digital siempre actualizado.
2. **Visitante en el móvil** (3 min): escanear el QR de Ana → `/r/<código>` → perfil público. Mostrar que el enlace oculto no aparece y que el email es privado. Pulsar «Guardar contacto» (vCard) y «Déjame tus datos»: intentar enviar sin consentimiento (bloqueado) y luego con consentimiento.
3. **Propietaria** (4 min): entrar como Ana.
   - *Contactos*: aparece el lead recién enviado, con fuente QR.
   - *Mi perfil*: cambiar el titular y el tema, ver la vista previa, guardar → refrescar el móvil.
   - *Enlaces*: ocultar uno, reordenarlo e intentar pegar `javascript:alert(1)` (rechazado).
   - *NFC y QR*: desactivar el QR → el móvil muestra «Código no disponible» → activarlo de nuevo.
4. **Borrador** (1 min): abrir `/p/luis-perez-demo` → «Perfil no disponible» (no revela si existe).
5. **Empresa** (2 min): entrar como `empresa@…` → *Administración*: solo ve los perfiles de los clientes de su organización (Ana, no Luis).
6. **Administración global** (3 min): entrar como SUPER_ADMIN → buscar `ana` → **Suspender** → el móvil muestra «no disponible» y Ana ve el aviso sin poder publicar. Explicar que queda auditado (`audit_logs`). Reactivar → queda en borrador → Ana publica.
7. **Seguridad de sesión** (1 min, opcional): «Cerrar todas las sesiones» y explicar el refresh token rotativo en cookie httpOnly.

## No mostrar como terminado
- Login con Google: el botón se activa con `NEXT_PUBLIC_GOOGLE_LOGIN=true` solo cuando haya credenciales reales probadas.
- Pagos, membresías, analítica, Google Contacts y app móvil (backlog).
- Si no se probó antes con un teléfono real: la importación de la vCard en iOS/Android y la lectura NFC.
