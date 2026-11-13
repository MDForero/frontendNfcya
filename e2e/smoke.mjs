// Prueba de humo E2E en navegador real: backend + frontend levantados (ver README → Pruebas).
//
//   API_URL=http://localhost:3001 WEB_URL=http://localhost:3000 \
//   BACKEND_LOG=/ruta/al/log/del/backend DB_URL=postgres://… CHROME_PATH=/ruta/a/chrome \
//   node e2e/smoke.mjs
//
// Requiere MAIL_TRANSPORT=log en el backend (lee el token de verificación del log) y
// `playwright-core` disponible (npm i -g playwright-core o en un directorio aparte).
import { chromium, devices } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const API = process.env.API_URL ?? 'http://localhost:3001';
const WEB = process.env.WEB_URL ?? 'http://localhost:3000';
const DIR = process.env.SCREENSHOT_DIR ?? new URL('.', import.meta.url).pathname;
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

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
}

async function registerVerified(email, name) {
  await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password: PASSWORD }) });
  for (let i = 0; i < 40; i++) {
    const log = readFileSync(BACKEND_LOG, 'utf8');
    const idx = log.lastIndexOf(email);
    const match = idx >= 0 ? /token=([A-Za-z0-9_-]+)/.exec(log.slice(idx)) : null;
    if (match) {
      const res = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token: match[1] }) });
      if (res.status < 300) return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`No se pudo verificar ${email}`);
}

const sql = (q) => execSync(`psql "${DB_URL}" -tAc "${q}"`).toString().trim();

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
});

try {
  // ---------- Propietario (escritorio) ----------
  const ownerEmail = `owner-${run}@example.com`;
  await registerVerified(ownerEmail, 'Ana Gómez');
  const owner = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await owner.newPage();
  const refreshCalls = [];
  page.on('request', (r) => r.url().endsWith('/auth/refresh') && refreshCalls.push(Date.now()));
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  // Login inválido: muestra error y no dispara refresh automático
  // La restauración de sesión al cargar hace un /auth/refresh (401 sin cookie); se espera
  // a que termine para medir solo lo que provoque el login inválido.
  const initialRefresh = page.waitForResponse((r) => r.url().endsWith('/auth/refresh'), { timeout: 15000 }).catch(() => undefined);
  await page.goto(`${WEB}/login`);
  await initialRefresh;
  await page.waitForLoadState('networkidle');
  const refreshBefore = refreshCalls.length;
  await page.fill('#email', ownerEmail);
  await page.fill('#password', 'Incorrecta999');
  await page.click('button[type=submit]');
  await page.getByText('Email o contraseña incorrectos').waitFor({ timeout: 5000 });
  check('Login inválido muestra error sin refresh', refreshCalls.length === refreshBefore, `${refreshCalls.length - refreshBefore}`);

  // Login válido
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard');
  await page.getByText('Aún no has creado tu perfil').waitFor();
  check('Login válido → dashboard con estado "sin perfil"', true);
  const lang = await page.getAttribute('html', 'lang');
  check('html lang="es"', lang === 'es', lang);

  // Navbar por rol: CLIENTE no ve Administración
  const navText = await page.locator('nav[aria-label="Principal"]').innerText();
  check('Navbar CLIENTE sin "Administración"', !navText.includes('Administración') && navText.includes('NFC y QR'));

  // Crear perfil
  const slug = `ana-${run}`;
  await page.click('nav >> text=Mi perfil');
  await page.waitForURL('**/profile');
  await page.fill('#slug', `Ana ${run}`);
  await page.getByText(`Disponible: ${slug}`).waitFor({ timeout: 5000 });
  check('Slug normalizado y disponible en vivo', true);
  await page.fill('#headline', 'Diseñadora; fundadora');
  await page.fill('#bio', 'Hola, soy Ana.\nDiseño marcas.');
  await page.fill('#phone', '+57 300 123 4567');
  await page.check('#showPhone');
  await page.fill('#email', 'ana-privado@example.com');
  await page.check('#leadsEnabled');
  await page.click('text=Océano');
  await page.click('button:has-text("Crear perfil")');
  await page.getByText('Perfil creado como borrador').waitFor();
  check('Perfil creado como borrador', (await page.getByText('Borrador').count()) > 0);

  // Vista previa respeta privacidad
  const preview = await page.locator('aside').innerText();
  check('Vista previa: teléfono visible, email privado', preview.includes('+57 300 123 4567') && !preview.includes('ana-privado'));

  // Slug duplicado (otro usuario) — se valida más abajo con el segundo usuario
  await page.click('button:has-text("Publicar")');
  await page.getByText('Perfil publicado.', { exact: true }).waitFor();
  check('Publicar', true);

  // Enlaces
  await page.click('nav >> text=Enlaces');
  await page.waitForURL('**/links');
  await page.getByText('Aún no tienes enlaces').waitFor();
  const addLink = async (type, label, url) => {
    await page.selectOption('#link-type', type);
    await page.fill('#link-label', label);
    await page.fill('#link-url', url);
    await page.click('button:has-text("Agregar")');
    await page.locator('ol li', { hasText: label }).waitFor();
  };
  await addLink('WEBSITE', 'Portafolio', 'ana.example.com');
  await addLink('WHATSAPP', 'WhatsApp', 'https://wa.me/573001234567');
  await addLink('OTHER', 'Secreto', 'https://secreto.example.com');
  check('Crear 3 enlaces (URL sin esquema completada a https)', (await page.getByText('https://ana.example.com').count()) === 1);

  await page.click('button[aria-label="Ocultar Secreto"]');
  await page.locator('ol li', { hasText: 'Secreto' }).getByText('Oculto').waitFor();
  await page.click('button[aria-label="Subir WhatsApp"]');
  await page.waitForTimeout(500);
  const order = await page.locator('ol li span.truncate').allInnerTexts();
  check('Ocultar y reordenar enlaces', order.join(',') === 'WhatsApp,Portafolio,Secreto', order.join(','));

  // URL peligrosa rechazada por la API y mostrada como error
  await page.fill('#link-label', 'Malo');
  await page.fill('#link-url', 'javascript:alert(1)');
  await page.click('button:has-text("Agregar")');
  await page.getByText('debe ser una URL http(s), mailto: o tel: válida').waitFor({ timeout: 5000 });
  check('URL javascript: rechazada con mensaje', true);
  await page.fill('#link-label', '');
  await page.fill('#link-url', '');

  // NFC / QR
  await page.click('nav >> text=NFC y QR');
  await page.waitForURL('**/nfc-qr');
  await page.click('label:has-text("Chip NFC")');
  await page.fill('#identifier-label', 'Tarjeta Ana');
  await page.click('button:has-text("Crear código")');
  const urlText = await page.locator('p.font-mono').first().innerText();
  const code = urlText.split('/r/')[1];
  check('Crear código NFC con URL /r/:code', /^[A-Za-z0-9_-]{16}$/.test(code ?? ''), urlText);
  await page.locator('a[download$=".png"]').first().waitFor({ timeout: 5000 });
  check('QR descargable generado', (await page.locator('a[download$=".png"]').count()) === 1);

  // ---------- Visitante (móvil) ----------
  const visitor = await browser.newContext({ ...devices['Pixel 7'] });
  const vpage = await visitor.newPage();
  const visitorRefresh = [];
  vpage.on('request', (r) => r.url().endsWith('/auth/refresh') && visitorRefresh.push(1));
  await vpage.goto(`${WEB}/r/${code}`);
  await vpage.waitForURL(`**/p/${slug}?src=nfc`);
  await vpage.getByRole('heading', { name: 'Ana Gómez' }).waitFor();
  check('NFC /r/:code → /p/:slug?src=nfc', true);
  const body = await vpage.locator('article').innerText();
  // Solo la sección de enlaces: el teléfono también aparece como «WhatsApp» más arriba.
  const linksText = await vpage.locator('section[aria-label="Enlaces"]').innerText();
  check('Perfil público: enlaces visibles en orden, oculto ausente',
    linksText.indexOf('WhatsApp') < linksText.indexOf('Portafolio') && !body.includes('Secreto'));
  check('Perfil público: teléfono sí, email privado no', body.includes('+57 300 123 4567') && !body.includes('ana-privado'));
  const phoneLinks = await vpage.locator('a[href="https://wa.me/573001234567"]').count();
  const callLink = await vpage.locator('article a[href="tel:+573001234567"]').innerText().catch(() => '');
  const detailHref = await vpage.locator('section[aria-label="Contacto"] a').first().getAttribute('href');
  check('Perfil público: botones WhatsApp y Llamar; el número abre WhatsApp',
    phoneLinks >= 2 && callLink.includes('Llamar') && detailHref === 'https://wa.me/573001234567', `wa.me=${phoneLinks} llamar=${!!callLink} dato=${detailHref}`);
  check('Página pública no llama /auth/refresh', visitorRefresh.length === 0);
  const noHScroll = await vpage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  check('Móvil: sin scroll horizontal', noHScroll);
  await vpage.screenshot({ path: `${DIR}public-mobile.png`, fullPage: true });

  // vCard
  const vcardHref = await vpage.getAttribute('a:has-text("Guardar contacto")', 'href');
  const vcard = await fetch(vcardHref);
  const vtext = await vcard.text();
  check('vCard descargable', vcard.status === 200 && vcard.headers.get('content-type')?.startsWith('text/vcard')
    && vtext.includes('FN:Ana Gómez') && vtext.includes('TITLE:Diseñadora\\; fundadora') && !vtext.includes('ana-privado'),
    vcard.headers.get('content-disposition'));

  // Lead: sin consentimiento no se envía; con consentimiento sí (fuente NFC)
  await vpage.click('button:has-text("Déjame tus datos")');
  await vpage.fill('#lead-name', 'Visitante Uno');
  await vpage.fill('#lead-email', 'visitante@example.com');
  await vpage.click('button:has-text("Enviar")');
  await vpage.getByText('Debes aceptar el tratamiento de datos').waitFor();
  check('Lead sin consentimiento bloqueado', true);
  await vpage.check('input[type=checkbox]');
  await vpage.click('button:has-text("Enviar")');
  await vpage.getByText('¡Gracias!').waitFor();
  check('Lead con consentimiento enviado', true);

  // Propietario ve el lead
  await page.click('nav >> text=Contactos');
  await page.getByText('Visitante Uno').waitFor();
  check('Propietario ve el lead con fuente NFC', (await page.locator('li', { hasText: 'Visitante Uno' }).getByText('NFC').count()) === 1);

  // Capturas del rediseño (escritorio)
  await page.click('nav >> text=Inicio');
  await page.getByText('Copiar enlace').waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}dashboard-desktop.png`, fullPage: true });
  await page.click('nav >> text=Mi perfil');
  await page.locator('aside').waitFor();
  await page.screenshot({ path: `${DIR}editor-desktop.png`, fullPage: true });
  await page.click('nav >> text=Contactos');
  await page.getByText('Visitante Uno').waitFor();

  // Propietario en móvil: barra de pestañas inferior, sin scroll horizontal
  {
    const mobile = await browser.newContext({ ...devices['iPhone 13'] });
    const mpage = await mobile.newPage();
    await mpage.goto(`${WEB}/login`);
    // Tras hidratar: la captura oculta el cursor con un estilo inline y, antes de hidratar,
    // React lo detecta como diferencia de hidratación (badge de Next que tapa la barra inferior).
    await mpage.waitForLoadState('networkidle');
    await mpage.screenshot({ path: `${DIR}login-mobile.png`, caret: 'initial' });
    await mpage.fill('#email', ownerEmail);
    await mpage.fill('#password', PASSWORD);
    await mpage.click('button[type=submit]');
    await mpage.waitForURL('**/dashboard');
    const tabs = mpage.locator('nav[aria-label="Secciones"]');
    check('Móvil: barra de pestañas inferior visible y menú superior oculto',
      (await tabs.isVisible()) && !(await mpage.locator('nav[aria-label="Principal"]').isVisible()));
    await tabs.getByText('NFC y QR').click();
    await mpage.waitForURL('**/nfc-qr');
    await mpage.locator('p.font-mono').first().waitFor();
    await mpage.waitForTimeout(400);
    const fits = await mpage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check('Móvil: NFC y QR sin scroll horizontal y navegable por pestañas', fits);
    await mpage.screenshot({ path: `${DIR}nfc-mobile.png`, fullPage: true });
    await tabs.getByText('Perfil').click();
    await mpage.locator('aside').waitFor();
    const fitsEditor = await mpage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    check('Móvil: editor de perfil sin scroll horizontal', fitsEditor);
    await mpage.screenshot({ path: `${DIR}editor-mobile.png`, fullPage: true });
    await mobile.close();
  }

  // Sesión: recargar mantiene sesión con un solo refresh
  const before = refreshCalls.length;
  await page.reload();
  await page.getByText('Visitante Uno').waitFor();
  await page.waitForTimeout(500);
  check('Recarga restaura sesión con un único /auth/refresh', refreshCalls.length - before === 1, `${refreshCalls.length - before}`);

  // Desactivar código → no disponible; reactivar
  await page.click('nav >> text=NFC y QR');
  await page.click('button:has-text("Desactivar")');
  await page.getByText('Desactivado', { exact: true }).waitFor();
  await vpage.goto(`${WEB}/r/${code}`);
  await vpage.getByText('Código no disponible').waitFor();
  check('Código desactivado → no disponible', true);
  await page.click('button:has-text("Activar")');
  await page.locator('span', { hasText: /^Activo$/ }).waitFor();

  // Despublicar → perfil no disponible
  await page.click('nav >> text=Mi perfil');
  await page.click('button:has-text("Despublicar")');
  await page.getByText('Perfil despublicado').waitFor();
  await vpage.goto(`${WEB}/p/${slug}`);
  await vpage.getByText('Perfil no disponible').waitFor();
  check('Perfil despublicado → no disponible', true);
  await page.click('button:has-text("Publicar")');
  const matches = page.getByText('Perfil publicado.', { exact: true });
  await matches.first().waitFor();
  const html = await matches.evaluateAll((els) => els.map((e) => e.outerHTML.slice(0, 160)));
  check('Aviso de publicación único', html.length === 1, html.join(' || '));

  // ---------- Otro usuario: slug duplicado y acceso cruzado ----------
  const otherEmail = `otro-${run}@example.com`;
  await registerVerified(otherEmail, 'Luis');
  const other = await browser.newContext();
  const opage = await other.newPage();
  await opage.goto(`${WEB}/login`);
  await opage.fill('#email', otherEmail);
  await opage.fill('#password', PASSWORD);
  await opage.click('button[type=submit]');
  await opage.waitForURL('**/dashboard');
  await opage.goto(`${WEB}/profile`);
  await opage.fill('#slug', slug);
  await opage.getByText('Ese slug ya está en uso').waitFor({ timeout: 5000 });
  check('Slug ocupado detectado en vivo', true);
  await opage.goto(`${WEB}/admin/profiles`);
  await opage.getByText('No tienes permisos').waitFor();
  check('CLIENTE en /admin/profiles → sin permisos (UI)', true);

  // ---------- Administración ----------
  const adminEmail = `admin-${run}@example.com`;
  await registerVerified(adminEmail, 'Admin');
  sql(`UPDATE users SET role='SUPER_ADMIN' WHERE email='${adminEmail}'`);
  const admin = await browser.newContext({ ...devices['iPhone 13'] });
  const apage = await admin.newPage();
  await apage.goto(`${WEB}/login`);
  await apage.fill('#email', adminEmail);
  await apage.fill('#password', PASSWORD);
  await apage.click('button[type=submit]');
  await apage.waitForURL('**/dashboard');
  // Móvil: barra de pestañas inferior
  await apage.click('nav[aria-label="Secciones"] >> text=Admin');
  await apage.waitForURL('**/admin/profiles');
  await apage.fill('input[aria-label="Buscar perfiles"]', slug);
  await apage.click('button:has-text("Buscar")');
  await apage.locator('tr', { hasText: ownerEmail }).waitFor();
  check('SUPER_ADMIN (móvil) busca el perfil por slug', true);
  apage.once('dialog', (d) => d.accept());
  await apage.locator('tr', { hasText: ownerEmail }).getByRole('button', { name: 'Suspender' }).click();
  await apage.locator('tr', { hasText: ownerEmail }).getByText('Suspendido').waitFor();
  await apage.screenshot({ path: `${DIR}admin-mobile.png`, fullPage: true });
  await vpage.goto(`${WEB}/p/${slug}`);
  await vpage.getByText('Perfil no disponible').waitFor();
  check('Suspensión oculta el perfil público', true);
  const audit = sql(`SELECT action FROM audit_logs a JOIN users u ON u.id=a.target_user_id WHERE u.email='${ownerEmail}'`);
  check('Suspensión auditada', audit.includes('PROFILE_SUSPENDED'), audit);
  await page.goto(`${WEB}/profile`);
  await page.getByText('suspendido por administración').waitFor();
  check('Propietario ve aviso de suspensión y no puede publicar', (await page.locator('button:has-text("Publicar")').count()) === 0);

  // ---------- Administración de usuarios ----------
  await apage.click('nav[aria-label="Administración"] >> text=Usuarios');
  await apage.waitForURL('**/admin/users');
  check('Pestaña Usuarios accesible desde Administración', true);
  // Alta de un SUPER_ADMIN por invitación
  const invitedEmail = `invitado-${run}@example.com`;
  await apage.click('button:has-text("Nuevo administrador")');
  await apage.fill('#admin-name', 'Admin Invitado');
  await apage.fill('#admin-email', invitedEmail);
  await apage.selectOption('#admin-role', 'SUPER_ADMIN');
  await apage.click('button:has-text("Crear y enviar invitación")');
  await apage.getByText(`Invitación enviada a ${invitedEmail}`).waitFor();
  await apage.locator('tr', { hasText: invitedEmail }).getByText('Invitación pendiente').waitFor();
  check('SUPER_ADMIN crea otro administrador (invitación pendiente)', true);
  let inviteToken = null;
  for (let i = 0; i < 40 && !inviteToken; i++) {
    const log = readFileSync(BACKEND_LOG, 'utf8');
    const idx = log.lastIndexOf(invitedEmail);
    inviteToken = idx >= 0 ? /token=([A-Za-z0-9_-]+)/.exec(log.slice(idx))?.[1] : null;
    if (!inviteToken) await new Promise((r) => setTimeout(r, 150));
  }
  const invited = await browser.newContext();
  const ipage = await invited.newPage();
  await ipage.goto(`${WEB}/auth/reset-password?token=${inviteToken}`);
  await ipage.fill('#password', 'NuevaClave123');
  await ipage.fill('#confirmPassword', 'NuevaClave123').catch(() => undefined);
  await ipage.click('button[type=submit]');
  await new Promise((r) => setTimeout(r, 800));
  const invitedLogin = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: invitedEmail, password: 'NuevaClave123' }) });
  check('El invitado define su clave con el enlace y entra como SUPER_ADMIN',
    invitedLogin.status === 200 && invitedLogin.body.user?.role === 'SUPER_ADMIN', `status ${invitedLogin.status}`);
  await invited.close();
  // Eliminación definitiva con confirmación por email
  await apage.fill('input[aria-label="Buscar usuarios"]', otherEmail);
  await apage.click('button:has-text("Buscar")');
  const otherRow = apage.locator('tr', { hasText: otherEmail });
  await otherRow.getByRole('button', { name: 'Gestionar' }).click();
  const deleteButton = apage.getByRole('button', { name: 'Eliminar definitivamente' });
  check('Eliminar exige escribir el email', await deleteButton.isDisabled());
  await apage.fill(`input[id^="confirm-"]`, otherEmail);
  await deleteButton.click();
  await apage.getByText(`Usuario ${otherEmail} eliminado`).waitFor();
  await apage.screenshot({ path: `${DIR}admin-users-mobile.png`, fullPage: true });
  const left = sql(`SELECT count(*) FROM users WHERE email='${otherEmail}'`);
  const deletedAudit = sql(`SELECT count(*) FROM audit_logs WHERE action='USER_DELETED' AND before->>'email'='${otherEmail}'`);
  check('Usuario eliminado de la BD y auditado', left === '0' && deletedAudit === '1', `users=${left} audit=${deletedAudit}`);
  await page.goto(`${WEB}/admin/users`);
  await page.getByText('No tienes permisos').waitFor();
  check('CLIENTE en /admin/users → sin permisos (UI)', true);

  // ---------- Logout ----------
  await page.click('[aria-label="Menú de cuenta"]').catch(() => undefined);
  const logoutItem = page.getByText(/Cerrar sesión$/).first();
  if (await logoutItem.count()) {
    await logoutItem.click();
    await page.waitForURL('**/login**');
    check('Logout → /login', true);
    await page.goto(`${WEB}/links`);
    await page.waitForURL('**/login?callbackUrl=%2Flinks');
    check('Ruta protegida sin sesión → /login con callbackUrl', true);
  } else {
    check('Logout → /login', false, 'no se encontró el menú de perfil');
  }

  check('Sin errores de consola en la sesión del propietario (excepto 4xx esperados)',
    consoleErrors.filter((e) => !/40[0-9]|Failed to load resource/.test(e)).length === 0,
    consoleErrors.slice(0, 3).join(' | '));
} catch (error) {
  check('Recorrido completo sin excepciones', false, error.message.split('\n')[0]);
} finally {
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`);
  process.exit(failed ? 1 : 0);
}
