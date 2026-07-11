// Golden harness de CONFIGURACION (ConfiguracionController): CRUD de configuracion_sistema.
// Lecturas comparadas byte-a-byte. Errores: ConfiguracionController usa ApiResponse ({ok,msg})
// igual que el filtro de Nest → se comparan completos. Mutaciones resetean entre corridas.
//
// Uso: TOKEN_SECRET=... node test/config-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const mint = (id, username, rol, tv) => { const now = Math.floor(Date.now() / 1000); return jwt({ iat: now, exp: now + 3600, data: { id, username, nombre: null, rol, modulos: [], token_version: tv } }); };

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
  else { fail++; console.log(`  ❌ ${name}`); d.slice(0, 8).forEach((x) => console.log(`        ${x}`)); }
}

const K = 'zz_gold_cfg';
async function setup() {
  await q(`DELETE FROM configuracion_sistema WHERE clave=?`, [K]);
  await q(`INSERT INTO configuracion_sistema (grupo, clave, valor, tipo, descripcion, updated_at, updated_by)
           VALUES ('sistema', ?, '1', 'number', 'test golden', '2026-01-01 00:00:00', 'seed')`, [K]);
}
async function resetKey() {
  await q(`UPDATE configuracion_sistema SET valor='1', tipo='number', updated_at='2026-01-01 00:00:00', updated_by='seed' WHERE clave=?`, [K]);
}
async function cleanup() { await q(`DELETE FROM configuracion_sistema WHERE clave=?`, [K]); }

try {
  const admin = (await q(`SELECT id_usuarios, token_version FROM usuarios WHERE username='root' LIMIT 1`))[0];
  const adminTok = mint(admin.id_usuarios, 'root', 'admin', admin.token_version);
  const operTok = mint(admin.id_usuarios, 'root', 'operador', admin.token_version); // rol operador (tv válido)
  await setup();
  console.log('\nFixture: clave zz_gold_cfg=1 (number)\n');

  // ── LECTURAS ──
  console.log('── LECTURAS ──');
  check('GET configuracion (getAllGrouped)',
    await api(CI4, 'GET', '/api/configuracion', null, adminTok),
    await api(NEST, 'GET', '/api/configuracion', null, adminTok));
  for (const g of ['seguridad', 'tributaria', 'umbrales', 'notificaciones', 'sistema']) {
    check(`GET configuracion/grupo/${g}`,
      await api(CI4, 'GET', `/api/configuracion/grupo/${g}`, null, adminTok),
      await api(NEST, 'GET', `/api/configuracion/grupo/${g}`, null, adminTok));
  }
  check('GET configuracion/tipos-movimiento',
    await api(CI4, 'GET', '/api/configuracion/tipos-movimiento', null, adminTok),
    await api(NEST, 'GET', '/api/configuracion/tipos-movimiento', null, adminTok));
  check('GET configuracion/:clave (jwt_expiracion_horas)',
    await api(CI4, 'GET', '/api/configuracion/jwt_expiracion_horas', null, adminTok),
    await api(NEST, 'GET', '/api/configuracion/jwt_expiracion_horas', null, adminTok));
  check('GET configuracion/:clave inexistente (404)',
    await api(CI4, 'GET', '/api/configuracion/zz_no_existe', null, adminTok),
    await api(NEST, 'GET', '/api/configuracion/zz_no_existe', null, adminTok));

  // ── UPDATE ──
  console.log('\n── PUT configuracion/:clave (admin) ──');
  const upd = async (base, valor) => {
    const r = await api(base, 'PUT', `/api/configuracion/${K}`, { valor }, adminTok);
    const row = (await q(`SELECT valor, tipo FROM configuracion_sistema WHERE clave=?`, [K]))[0];
    const cap = { status: r.status, body: r.body, dbValor: row.valor, dbTipo: row.tipo };
    await resetKey();
    return cap;
  };
  check('PUT :clave valor=42', await upd(CI4, 42), await upd(NEST, 42));
  check('PUT :clave valor=null (array_key_exists permite null)', await upd(CI4, null), await upd(NEST, null));
  check('PUT :clave sin valor (422)',
    await api(CI4, 'PUT', `/api/configuracion/${K}`, { otro: 1 }, adminTok),
    await api(NEST, 'PUT', `/api/configuracion/${K}`, { otro: 1 }, adminTok));
  await resetKey();
  check('PUT :clave sin admin (403)',
    await api(CI4, 'PUT', `/api/configuracion/${K}`, { valor: 5 }, operTok),
    await api(NEST, 'PUT', `/api/configuracion/${K}`, { valor: 5 }, operTok));

  // ── BULK ──
  console.log('\n── PUT configuracion/bulk (admin) ──');
  const bulk = async (base) => {
    const r = await api(base, 'PUT', '/api/configuracion/bulk', { configs: { [K]: 99 } }, adminTok);
    const row = (await q(`SELECT valor FROM configuracion_sistema WHERE clave=?`, [K]))[0];
    const cap = { status: r.status, body: r.body, dbValor: row.valor };
    await resetKey();
    return cap;
  };
  check('PUT bulk (1 config)', await bulk(CI4), await bulk(NEST));
  check('PUT bulk vacío (422)',
    await api(CI4, 'PUT', '/api/configuracion/bulk', { configs: {} }, adminTok),
    await api(NEST, 'PUT', '/api/configuracion/bulk', { configs: {} }, adminTok));
  check('PUT bulk sin admin (403)',
    await api(CI4, 'PUT', '/api/configuracion/bulk', { configs: { [K]: 1 } }, operTok),
    await api(NEST, 'PUT', '/api/configuracion/bulk', { configs: { [K]: 1 } }, operTok));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanup().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
