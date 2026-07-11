// Golden harness de AUTH (UsuarioController): login/refresh/logout/me/crear/perfil/password.
// Compara Nest vs CI4. Los tokens no se comparan crudos (iat/refresh aleatorios): se decodifica
// el JWT y se comparan los claims (data + ttl). Estado mutado se resetea entre corridas.
//
// Uso: TOKEN_SECRET=... node test/auth-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
function decode(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try { return JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()); }
  catch { return null; }
}

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

async function api(base, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch { j = null; }
  return { status: r.status, body: j };
}

let pass = 0, fail = 0;
function eqScalar(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (String(a) === String(b)) return true;
  const na = Number(a), nb = Number(b);
  return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb;
}
function diff(a, b, path = '') {
  const d = [];
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return [`${path}: array vs no-array`];
    if (a.length !== b.length) d.push(`${path}: len ${a.length} vs ${b.length}`);
    for (let i = 0; i < Math.min(a.length, b.length); i++) d.push(...diff(a[i], b[i], `${path}[${i}]`));
    return d;
  }
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!(k in a)) { d.push(`${path}.${k}: solo Nest`); continue; }
      if (!(k in b)) { d.push(`${path}.${k}: solo CI4`); continue; }
      d.push(...diff(a[k], b[k], `${path}.${k}`));
    }
    return d;
  }
  if (!eqScalar(a, b)) d.push(`${path}: ${JSON.stringify(a)} (CI4) != ${JSON.stringify(b)} (Nest)`);
  return d;
}
function check(name, ci4, nest) {
  const d = diff(ci4, nest);
  if (d.length === 0) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); d.slice(0, 10).forEach((x) => console.log(`        ${x}`)); }
}

// ── fixtures ──
const U = 'zz_gold_auth';
const PWD = 'secret123';
let AUTH_ID, ADMIN_ID, ADMIN_TV;
const HASH = bcrypt.hashSync(PWD, 10);

async function cleanupUsers() {
  await q(`DELETE FROM refresh_tokens WHERE usuario_id IN (SELECT id_usuarios FROM usuarios WHERE username IN (?, 'zz_gold_new'))`, [U]);
  await q(`DELETE FROM usuarios WHERE username IN (?, 'zz_gold_new')`, [U]);
  await q(`DELETE FROM login_attempts WHERE username_attempt IN (?, 'zz_gold_new')`, [U]);
}

async function setup() {
  await cleanupUsers();
  const r = await q(`INSERT INTO usuarios (username, nombre, password, rol, password_must_change, token_version) VALUES (?, 'Golden Auth', ?, 'operador', 0, 1)`, [U, HASH]);
  AUTH_ID = r.insertId;
  const admin = (await q(`SELECT id_usuarios, token_version FROM usuarios WHERE rol='admin' AND username='root' LIMIT 1`))[0];
  ADMIN_ID = admin.id_usuarios; ADMIN_TV = admin.token_version;
}

async function tvOf(id) { return Number((await q(`SELECT token_version FROM usuarios WHERE id_usuarios=?`, [id]))[0].token_version); }
async function resetUser() {
  await q(`UPDATE usuarios SET password=?, token_version=1, nombre='Golden Auth', password_must_change=0 WHERE id_usuarios=?`, [HASH, AUTH_ID]);
  await q(`DELETE FROM refresh_tokens WHERE usuario_id=?`, [AUTH_ID]);
  await q(`DELETE FROM login_attempts WHERE username_attempt=?`, [U]);
}
function mintFor(id, username, rol, tv) {
  const now = Math.floor(Date.now() / 1000);
  return jwt({ iat: now, exp: now + 3600, data: { id, username, nombre: null, rol, modulos: [], token_version: tv } });
}

// normaliza respuesta de login/refresh/perfil: reemplaza token→claims, refresh→bool
function normToken(body) {
  const o = { ...body };
  if ('token' in o) { const p = decode(o.token); o.token = p ? { data: p.data, ttl: p.exp - p.iat } : o.token; }
  if ('refresh_token' in o) o.refresh_token = typeof o.refresh_token === 'string' && o.refresh_token.length > 0;
  return o;
}

// ═══════════════════════ RUN ═══════════════════════
try {
  await setup();
  console.log(`\nFixture: usuario ${U} id=${AUTH_ID}, admin root id=${ADMIN_ID} tv=${ADMIN_TV}\n`);

  // ── LOGIN ──
  console.log('── LOGIN ──');
  await q(`DELETE FROM login_attempts WHERE username_attempt=?`, [U]);
  const loginOk = async (base) => { const r = await api(base, 'POST', '/api/login', { username: U, password: PWD }); await q(`DELETE FROM refresh_tokens WHERE usuario_id=?`, [AUTH_ID]); await q(`DELETE FROM login_attempts WHERE username_attempt=?`, [U]); return { status: r.status, body: normToken(r.body || {}) }; };
  check('login OK', await loginOk(CI4), await loginOk(NEST));

  const loginBad = async (base) => { const r = await api(base, 'POST', '/api/login', { username: U, password: 'wrong' }); await q(`DELETE FROM login_attempts WHERE username_attempt=?`, [U]); return r; };
  check('login password incorrecta (200 ok:false)', await loginBad(CI4), await loginBad(NEST));

  check('login sin username (400)',
    await api(CI4, 'POST', '/api/login', { password: 'x' }),
    await api(NEST, 'POST', '/api/login', { password: 'x' }));
  check('login sin password (400)',
    await api(CI4, 'POST', '/api/login', { username: U }),
    await api(NEST, 'POST', '/api/login', { username: U }));

  // ── ME ──
  console.log('\n── ME / ACTIVIDAD ──');
  const tok = () => mintFor(AUTH_ID, U, 'operador', 1);
  check('auth/me',
    await api(CI4, 'GET', '/api/auth/me', null, tok()),
    await api(NEST, 'GET', '/api/auth/me', null, tok()));

  // seed actividad
  await q(`INSERT INTO login_attempts (ip_address, username_attempt) VALUES ('1.2.3.4', ?)`, [U]);
  check('usuarios/mi-actividad',
    await api(CI4, 'GET', '/api/usuarios/mi-actividad', null, tok()),
    await api(NEST, 'GET', '/api/usuarios/mi-actividad', null, tok()));
  await q(`DELETE FROM login_attempts WHERE username_attempt=?`, [U]);

  // ── PERFIL ──
  console.log('\n── PERFIL ──');
  const perfil = async (base) => { const r = await api(base, 'PATCH', '/api/usuarios/mi-perfil', { nombre: 'Nombre Nuevo' }, tok()); const dbNombre = (await q(`SELECT nombre FROM usuarios WHERE id_usuarios=?`, [AUTH_ID]))[0].nombre; await q(`UPDATE usuarios SET nombre='Golden Auth' WHERE id_usuarios=?`, [AUTH_ID]); return { status: r.status, body: normToken(r.body || {}), dbNombre }; };
  check('mi-perfil (update nombre + re-token)', await perfil(CI4), await perfil(NEST));
  check('mi-perfil nombre >100 (400)',
    await api(CI4, 'PATCH', '/api/usuarios/mi-perfil', { nombre: 'x'.repeat(101) }, tok()),
    await api(NEST, 'PATCH', '/api/usuarios/mi-perfil', { nombre: 'x'.repeat(101) }, tok()));

  // ── CAMBIAR PASSWORD ──
  console.log('\n── PASSWORD ──');
  const chgPwd = async (base) => {
    const r = await api(base, 'PATCH', '/api/usuarios/mi-password', { currentPassword: PWD, newPassword: 'nuevaClave9' }, tok());
    const row = (await q(`SELECT password, token_version, password_must_change FROM usuarios WHERE id_usuarios=?`, [AUTH_ID]))[0];
    const cap = { status: r.status, body: normToken(r.body || {}), tvAfter: Number(row.token_version), pwdOk: bcrypt.compareSync('nuevaClave9', row.password), mustChange: Number(row.password_must_change) };
    await resetUser();
    return cap;
  };
  check('mi-password (cambia + tv++ + re-token)', await chgPwd(CI4), await chgPwd(NEST));
  check('mi-password actual incorrecta (400)',
    await api(CI4, 'PATCH', '/api/usuarios/mi-password', { currentPassword: 'mala', newPassword: 'nuevaClave9' }, tok()),
    await api(NEST, 'PATCH', '/api/usuarios/mi-password', { currentPassword: 'mala', newPassword: 'nuevaClave9' }, tok()));
  await resetUser();
  check('mi-password muy corta (400)',
    await api(CI4, 'PATCH', '/api/usuarios/mi-password', { currentPassword: PWD, newPassword: 'abc' }, tok()),
    await api(NEST, 'PATCH', '/api/usuarios/mi-password', { currentPassword: PWD, newPassword: 'abc' }, tok()));

  // ── LOGOUT ──
  console.log('\n── LOGOUT ──');
  const logout = async (base) => {
    await q(`INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, created_at, revoked) VALUES (?, 'x', DATE_ADD(NOW(),INTERVAL 7 DAY), NOW(), 0)`, [AUTH_ID]);
    const r = await api(base, 'POST', '/api/auth/logout', null, tok());
    const row = (await q(`SELECT token_version FROM usuarios WHERE id_usuarios=?`, [AUTH_ID]))[0];
    const rt = (await q(`SELECT COUNT(*) n FROM refresh_tokens WHERE usuario_id=? AND revoked=0`, [AUTH_ID]))[0];
    const cap = { status: r.status, body: r.body, tvAfter: Number(row.token_version), refreshActivos: Number(rt.n) };
    await resetUser();
    return cap;
  };
  check('auth/logout (tv++ + revoca refresh)', await logout(CI4), await logout(NEST));

  // ── REFRESH ──
  console.log('\n── REFRESH ──');
  const refresh = async (base) => {
    const plain = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(plain).digest('hex');
    const ins = await q(`INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, created_at, revoked) VALUES (?, ?, DATE_ADD(NOW(),INTERVAL 7 DAY), NOW(), 0)`, [AUTH_ID, hash]);
    const r = await api(base, 'POST', '/api/auth/refresh', { refresh_token: plain });
    const oldRevoked = Number((await q(`SELECT revoked FROM refresh_tokens WHERE id=?`, [ins.insertId]))[0].revoked);
    const cap = { status: r.status, body: normToken(r.body || {}), oldRevoked };
    await q(`DELETE FROM refresh_tokens WHERE usuario_id=?`, [AUTH_ID]);
    return cap;
  };
  check('auth/refresh (rota token)', await refresh(CI4), await refresh(NEST));
  check('auth/refresh inválido (401)',
    await api(CI4, 'POST', '/api/auth/refresh', { refresh_token: 'bogus' }),
    await api(NEST, 'POST', '/api/auth/refresh', { refresh_token: 'bogus' }));
  check('auth/refresh vacío (401)',
    await api(CI4, 'POST', '/api/auth/refresh', {}),
    await api(NEST, 'POST', '/api/auth/refresh', {}));

  // ── CREAR ──
  // NOTA: /api/crear está en el `except` del filtro jwt de CI4 → $request->usuario
  // nunca se setea → CI4 SIEMPRE devuelve 403 (endpoint muerto). Nest lo implementa
  // correctamente (admin crea). Por eso acá verificamos el comportamiento CORRECTO de
  // Nest directamente en vez de comparar contra el 403 de CI4.
  console.log('\n── CREAR (CI4 roto: verificamos Nest-correcto) ──');
  const adminTok = () => mintFor(ADMIN_ID, 'root', 'admin', ADMIN_TV);
  const expect = (name, cond, got) => { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name} → ${JSON.stringify(got)}`); } };

  // confirmar que CI4 efectivamente está muerto
  const ci4Crear = await api(CI4, 'POST', '/api/crear', { username: 'zz_gold_new', password: 'secret123', nombre: 'Nuevo', rol: 'operador' }, adminTok());
  expect('CI4 /crear muerto (403, doc)', ci4Crear.status === 403, ci4Crear);

  const rNew = await api(NEST, 'POST', '/api/crear', { username: 'zz_gold_new', password: 'secret123', nombre: 'Nuevo', rol: 'operador' }, adminTok());
  const newRow = (await q(`SELECT rol, password FROM usuarios WHERE username='zz_gold_new'`))[0];
  expect('Nest crear admin → 200 {ok,msg}', rNew.status === 200 && rNew.body?.ok === true && rNew.body?.msg === 'Usuario creado correctamente', rNew.body);
  expect('Nest crear persiste (rol + bcrypt válido)', !!newRow && newRow.rol === 'operador' && bcrypt.compareSync('secret123', newRow.password), newRow);

  const rDup = await api(NEST, 'POST', '/api/crear', { username: 'zz_gold_new', password: 'secret123', nombre: 'Nuevo', rol: 'operador' }, adminTok());
  expect('Nest crear duplicado → 409', rDup.status === 409 && rDup.body?.msg === 'El username ya existe.', rDup);
  await q(`DELETE FROM usuarios WHERE username='zz_gold_new'`);

  const rNoAdmin = await api(NEST, 'POST', '/api/crear', { username: 'zz_x', password: 'secret123', nombre: 'N' }, tok());
  expect('Nest crear sin admin → 403', rNoAdmin.status === 403 && rNoAdmin.body?.msg === 'Solo administradores pueden crear usuarios.', rNoAdmin);

  const rVal = await api(NEST, 'POST', '/api/crear', { username: 'ab', password: '123', nombre: '' }, adminTok());
  expect('Nest crear validación → 422 con errors', rVal.status === 422 && !!rVal.body?.errors && !!rVal.body.errors.username, rVal);

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanupUsers().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
