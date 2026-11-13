// Pruebas de autenticación en navegador real (tareas 1.15 del MVP y 12.x de auth-frontend-integration).
//
//   API_URL=http://localhost:3001 WEB_URL=http://localhost:3000 \
//   BACKEND_LOG=/ruta/al/log/del/backend DB_URL=postgres://… CHROME_PATH=/ruta/a/chrome \
//   node e2e/auth-smoke.mjs
//
// El backend debe correr con MAIL_TRANSPORT=log (los enlaces de los correos se leen del log)
// y con JWT_ACCESS_TTL_SECONDS=310 para comprobar la renovación proactiva (5 min antes de
// caducar → a los ~10 s) y AUTH_THROTTLE_LIMIT alto (toda la suite sale de una IP y supera
// el límite por defecto de 20/min en /auth). Necesita `playwright-core`.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const API = process.env.API_URL ?? 'http://localhost:3001';
const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const BACKEND_LOG = process.env.BACKEND_LOG;
const DB_URL = process.env.DB_URL;
if (!BACKEND_LOG || !DB_URL) throw new Error('Define BACKEND_LOG y DB_URL');

const run = Date.now().toString(36);
const PASSWORD = 'Secreta123';
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

const sql = (q) => execSync(`psql "${DB_URL}" -tAc "${q}"`).toString().trim();
const logSize = () => readFileSync(BACKEND_LOG, 'utf8').length;

/** Espera el enlace de un correo (verify-email / reset-password) escrito en el log tras `from`. */
async function mailLink(email, kind, from) {
  for (let i = 0; i < 50; i++) {
    const log = readFileSync(BACKEND_LOG, 'utf8').slice(from);
    const idx = log.lastIndexOf(email);
    const match = idx >= 0 ? new RegExp(`(https?://\\S+/${kind}\\?token=[A-Za-z0-9_-]+)`).exec(log.slice(idx)) : null;
    if (match) return match[1];
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`No llegó el correo ${kind} a ${email}`);
}

async function createVerifiedUser(email, name = 'Usuario Prueba') {
  const from = logSize();
  await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password: PASSWORD }),
  });
  const token = new URL(await mailLink(email, 'verify-email', from)).searchParams.get('token');
  await fetch(`${API}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

/** Contexto nuevo que registra las peticiones a /auth/refresh y las navegaciones a /login. */
async function newSession(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const stats = { refresh: 0, loginNavs: 0 };
  page.on('request', (r) => r.url().endsWith('/auth/refresh') && stats.refresh++);
  page.on('framenavigated', (f) => f === page.mainFrame() && new URL(f.url()).pathname === '/login' && stats.loginNavs++);
  return { context, page, stats };
}

async function login(page, email, password = PASSWORD, expectPath = '/dashboard') {
  await page.goto(`${WEB}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL(`**${expectPath}`);
}

async function openAccountMenu(page) {
  await page.click('button[aria-label="Menú de cuenta"]');
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

try {
  // ---------- 1. Registro → verificación → login (por la UI) ----------
  {
    const email = `registro-${run}@example.com`;
    const { page } = await newSession(browser);
    await page.goto(`${WEB}/register`);
    await page.fill('#name', 'Registro UI');
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    const from = logSize();
    await page.click('button[type=submit]');
    await page.getByText('¡Registro Exitoso!').waitFor();
    check('Registro por UI muestra confirmación', true);

    // Sin verificar no entra
    await page.goto(`${WEB}/login`);
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.getByText('verifica tu email').waitFor();
    check('Login sin verificar → aviso de verificación', true);

    const link = await mailLink(email, 'verify-email', from);
    await page.goto(link.replace(/^https?:\/\/[^/]+/, WEB));
    await page.waitForURL('**/verify-email?token=*');
    await page.locator('[data-slot="alert"]').first().waitFor();
    const verifyText = await page.locator('[data-slot="alert"]').first().innerText();
    check('Enlace del correo verifica el email', !/inválid|expirad|error/i.test(verifyText), verifyText.trim());

    await login(page, email);
    check('Login tras verificar → dashboard', true);
  }

  // ---------- 2. Ruta protegida restaura destino tras login (12.4) + navegación sin re-auth (12.10) ----------
  const userEmail = `auth-${run}@example.com`;
  await createVerifiedUser(userEmail, 'Auth Prueba');
  {
    const { page, stats } = await newSession(browser);
    await page.goto(`${WEB}/links`);
    await page.waitForURL('**/login?callbackUrl=%2Flinks');
    await page.fill('#email', userEmail);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL('**/links');
    check('Tras login vuelve a la URL protegida pedida (callbackUrl)', true);

    const before = stats.refresh;
    for (const path of ['/profile', '/nfc-qr', '/leads', '/dashboard', '/change-password']) {
      await page.click(`a[href="${path}"]`);
      await page.waitForURL(`**${path}`);
    }
    check('Navegar entre 5 rutas protegidas no re-autentica', stats.refresh === before, `refresh=${stats.refresh - before}`);
    await page.context().close();
  }

  // ---------- 3. Error de red (12.8) ----------
  {
    const { page } = await newSession(browser);
    await page.goto(`${WEB}/login`);
    await page.route(`${API}/auth/login`, (route) => route.abort('internetdisconnected'));
    await page.fill('#email', userEmail);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    const alert = page.locator('[data-slot="alert"]');
    await alert.waitFor();
    check('Fallo de red en login muestra un error y no se queda cargando', (await page.locator('button[type=submit]').isEnabled()), (await alert.innerText()).trim());
    await page.context().close();
  }

  // ---------- 4. Renovación proactiva antes de caducar (12.5) ----------
  {
    const { page, stats } = await newSession(browser);
    await login(page, userEmail);
    const expiresIn = await page.evaluate(async (api) => {
      const r = await fetch(`${api}/auth/refresh`, { method: 'POST', credentials: 'include' });
      return (await r.json()).expiresIn;
    }, API).catch(() => null);
    // La llamada manual de arriba rota el token fuera de la app: recargamos para que la app tome el nuevo.
    await page.reload();
    await page.getByText('Hola,').waitFor(); // restauración inicial terminada (su refresh no cuenta)
    await page.waitForLoadState('networkidle');
    if (expiresIn && expiresIn <= 330) {
      const before = stats.refresh;
      await page.waitForTimeout((expiresIn - 300 + 4) * 1000);
      await page.click('a[href="/profile"]');
      await page.waitForURL('**/profile');
      await page.locator('h1', { hasText: 'Mi perfil' }).waitFor();
      check('Renovación proactiva sin interacción y la sesión sigue activa', stats.refresh - before === 1 && page.url().endsWith('/profile'), `refresh=${stats.refresh - before}, ttl=${expiresIn}s`);
    } else {
      check('Renovación proactiva', false, `arranca el backend con JWT_ACCESS_TTL_SECONDS=310 (ttl=${expiresIn})`);
    }
    await page.context().close();
  }

  // ---------- 5. Refresh inválido: sesión perdida → limpia estado y redirige una sola vez ----------
  {
    const email = `invalido-${run}@example.com`;
    await createVerifiedUser(email);
    const { page, stats } = await newSession(browser);
    await login(page, email);
    await page.click('a[href="/profile"]');
    await page.waitForURL('**/profile');
    // Suspender la cuenta: el access token deja de valer (401) y el refresh también falla.
    sql(`UPDATE users SET status='SUSPENDIDA' WHERE email='${email}'`);
    const refreshBefore = stats.refresh;
    const navsBefore = stats.loginNavs;
    await page.click('a[href="/links"]');
    await page.waitForURL('**/login**');
    await page.waitForTimeout(1500);
    check('Refresh inválido → una sola redirección a /login', stats.loginNavs - navsBefore === 1, `navs=${stats.loginNavs - navsBefore}`);
    check('Refresh inválido → un solo intento de renovación', stats.refresh - refreshBefore === 1, `refresh=${stats.refresh - refreshBefore}`);
    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.getByText('Tu cuenta está suspendida').waitFor();
    check('Cuenta suspendida no puede volver a entrar (mensaje claro)', true);
    sql(`UPDATE users SET status='ACTIVA' WHERE email='${email}'`);

    // Variante: refresh token revocado al recargar
    await login(page, email);
    await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    }).then(async (r) => {
      const { accessToken } = await r.json();
      await fetch(`${API}/auth/logout-all`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    });
    await page.reload();
    await page.waitForURL('**/login**');
    check('Refresh revocado al recargar → /login', true);
    await page.context().close();
  }

  // ---------- 6. Logout-all desde el menú ----------
  {
    const email = `logoutall-${run}@example.com`;
    await createVerifiedUser(email);
    const a = await newSession(browser);
    const b = await newSession(browser);
    await login(a.page, email);
    await login(b.page, email);
    await openAccountMenu(a.page);
    a.page.once('dialog', (d) => d.accept());
    await a.page.getByText('Cerrar todas las sesiones').click();
    await a.page.waitForURL('**/login**');
    check('Logout-all → /login en la sesión actual', true);
    await b.page.reload();
    await b.page.waitForURL('**/login**');
    check('Logout-all cierra también la otra sesión', true);
    await a.context.close();
    await b.context.close();
  }

  // ---------- 7. Recuperación y restablecimiento de contraseña ----------
  {
    const email = `recuperar-${run}@example.com`;
    const NEW = 'NuevaClave456';
    await createVerifiedUser(email);
    const other = await newSession(browser);
    await login(other.page, email);

    const { page } = await newSession(browser);
    await page.goto(`${WEB}/forgot-password`);
    await page.fill('#email', email);
    const from = logSize();
    await page.click('button[type=submit]');
    await page.getByText('Email Enviado').waitFor();
    check('Olvidé mi contraseña → confirmación', true);

    const link = await mailLink(email, 'reset-password', from);
    await page.goto(link.replace(/^https?:\/\/[^/]+/, WEB));
    await page.waitForURL('**/reset-password?token=*');
    await page.fill('#password', NEW);
    await page.fill('#confirmPassword', NEW);
    page.once('dialog', (d) => d.accept());
    await page.click('button[type=submit]');
    await page.waitForURL('**/login');
    check('Restablecer contraseña con el enlace del correo → /login', true);

    await page.fill('#email', email);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.getByText('Email o contraseña incorrectos').waitFor();
    check('La contraseña anterior ya no sirve', true);
    await login(page, email, NEW);
    check('Login con la contraseña nueva', true);

    await other.page.reload();
    await other.page.waitForURL('**/login**');
    check('Restablecer cierra las sesiones abiertas', true);

    // El enlace es de un solo uso
    const reuse = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: new URL(link).searchParams.get('token'), password: 'OtraClave789' }),
    });
    check('El enlace de recuperación es de un solo uso', reuse.status >= 400, `HTTP ${reuse.status}`);
  }

  // ---------- 8. Cambio de contraseña estando autenticado ----------
  {
    const email = `cambio-${run}@example.com`;
    const NEW = 'CambiadaClave789';
    await createVerifiedUser(email);
    const a = await newSession(browser);
    const b = await newSession(browser);
    await login(a.page, email);
    await login(b.page, email);

    await a.page.goto(`${WEB}/change-password`);
    await a.page.fill('#currentPassword', 'Incorrecta000');
    await a.page.fill('#newPassword', NEW);
    await a.page.fill('#confirmPassword', NEW);
    await a.page.click('button[type=submit]');
    await a.page.getByText('La contraseña actual es incorrecta').waitFor();
    check('Cambio con contraseña actual incorrecta → error en el campo', (await a.page.getByText('exitosamente').count()) === 0);

    await a.page.fill('#currentPassword', PASSWORD);
    await a.page.click('button[type=submit]');
    await a.page.getByText('Contraseña cambiada exitosamente').waitFor();
    check('Cambio de contraseña correcto', true);

    await a.page.reload();
    await a.page.waitForURL('**/change-password');
    check('La sesión actual sigue activa tras el cambio', true);
    await b.page.reload();
    await b.page.waitForURL('**/login**');
    check('El cambio cierra las demás sesiones', true);

    await login(b.page, email, NEW);
    check('Login con la contraseña cambiada', true);
    await a.context.close();
    await b.context.close();
  }

  // ---------- 9. Badge de rol por tipo de usuario (12.9) ----------
  {
    const org = sql(`INSERT INTO organizations (name) VALUES ('Org ${run}') RETURNING id`).split('\n')[0];
    const expected = {
      CLIENTE: 'bg-blue-100',
      EMPRESA: 'bg-green-100',
      SOPORTE: 'bg-orange-100',
      SUPER_ADMIN: 'bg-red-100',
    };
    const seen = [];
    for (const [role, color] of Object.entries(expected)) {
      const email = `rol-${role.toLowerCase()}-${run}@example.com`;
      await createVerifiedUser(email);
      sql(`UPDATE users SET role='${role}', organization_id=${role === 'EMPRESA' ? `'${org}'` : 'NULL'} WHERE email='${email}'`);
      const { page, context } = await newSession(browser);
      await login(page, email);
      const badge = page.locator('[data-slot="badge"]').filter({ hasText: /Cliente|Empresa|Soporte|Super Admin/ }).first();
      const cls = (await badge.getAttribute('class')) ?? '';
      seen.push(`${role}:${cls.includes(color) ? 'ok' : cls}`);
      await context.close();
    }
    check('Badge de rol con el color de cada rol', seen.every((s) => s.endsWith(':ok')), seen.join(' '));
  }

  // ---------- 10. Login con Google: botón y página /auth/callback ----------
  // Sin credenciales en la API, /auth/google vuelve con ?error=google_disabled. Con
  // credenciales reales se prueba a mano (tarea 8.3 de add-auth-and-roles).
  {
    const { page, context } = await newSession(browser);
    await page.goto(`${WEB}/login`);
    const button = page.getByRole('link', { name: 'Continuar con Google' });
    if (await button.count()) {
      await button.click();
      await page.waitForURL('**/auth/callback?error=*');
      const error = new URL(page.url()).searchParams.get('error');
      await page.locator('main [role=alert]').waitFor();
      check('Google: botón → API → /auth/callback muestra el error', !!error, `${error}: ${(await page.locator('main [role=alert]').innerText()).trim()}`);
    } else {
      check('Google: botón oculto sin NEXT_PUBLIC_GOOGLE_LOGIN=true', true);
    }
    // Con sesión ya escrita (lo que hace la API tras Google), /auth/callback entra al dashboard.
    const email = `google-${run}@example.com`;
    await createVerifiedUser(email);
    await login(page, email);
    await page.goto(`${WEB}/auth/callback`);
    await page.waitForURL('**/dashboard');
    check('Google: /auth/callback con sesión → dashboard', true);
    await context.close();
  }
} catch (error) {
  check('Recorrido completo sin excepciones', false, error.message.split('\n')[0]);
} finally {
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`);
  process.exit(failed ? 1 : 0);
}
