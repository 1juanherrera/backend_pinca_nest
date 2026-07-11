// Golden harness de PERMISOS (PermisosController): roles/permisos + roles/usuarios + cambiarRol.
// Compara Nest vs CI4. Éxito {success:true,data} debe coincidir exacto; los errores de Nest
// salen como {ok:false,msg} (divergencia tolerada) → en errores comparamos SOLO el status.
//
// Uso: TOKEN_SECRET=... node test/permisos-golden.mjs

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
function checkFull(name, ci4, nest) {
  const d = diff(ci4, nest);
  if (d.length === 0) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); d.slice(0, 8).forEach((x) => console.log(`        ${x}`)); }
}
function checkStatus(name, ci4, nest) {
  if (ci4.status === nest.status) { pass++; console.log(`  ✅ ${name} (status ${ci4.status})`); }
  else { fail++; console.log(`  ❌ ${name}: status ${ci4.status} (CI4) != ${nest.status} (Nest)`); }
}

// ── tokens ──
const SUPER = (async () => { const u = (await q(`SELECT id_usuarios, token_version FROM usuarios WHERE rol='superadmin' LIMIT 1`))[0]; return mint(u.id_usuarios, 'zsuper', 'superadmin', u.token_version); })();
const ADMIN = (async () => { const u = (await q(`SELECT id_usuarios, token_version FROM usuarios WHERE username='root' LIMIT 1`))[0]; return mint(u.id_usuarios, 'root', 'admin', u.token_version); })();

// ── fixtures ──
let TESTUID;
async function setup() {
  await q(`DELETE FROM usuarios WHERE username='zz_gold_rol'`);
  const r = await q(`INSERT INTO usuarios (username, nombre, password, rol, token_version) VALUES ('zz_gold_rol','Rol Test','x','operador',1)`);
  TESTUID = r.insertId;
}
async function cleanup() { await q(`DELETE FROM usuarios WHERE username='zz_gold_rol'`); }

try {
  const superTok = await SUPER, adminTok = await ADMIN;
  await setup();
  console.log(`\nFixture: usuario zz_gold_rol id=${TESTUID}\n`);

  // ── LECTURAS ──
  console.log('── LECTURAS ──');
  checkFull('GET roles/permisos',
    await api(CI4, 'GET', '/api/roles/permisos', null, adminTok),
    await api(NEST, 'GET', '/api/roles/permisos', null, adminTok));
  for (const rol of ['superadmin', 'admin', 'operador', 'visor']) {
    checkFull(`GET roles/permisos/${rol}`,
      await api(CI4, 'GET', `/api/roles/permisos/${rol}`, null, adminTok),
      await api(NEST, 'GET', `/api/roles/permisos/${rol}`, null, adminTok));
  }
  checkStatus('GET roles/permisos/rolinvalido (400)',
    await api(CI4, 'GET', '/api/roles/permisos/pepe', null, adminTok),
    await api(NEST, 'GET', '/api/roles/permisos/pepe', null, adminTok));

  console.log('\n── roles/usuarios (superadmin) ──');
  checkFull('GET roles/usuarios (superadmin)',
    await api(CI4, 'GET', '/api/roles/usuarios', null, superTok),
    await api(NEST, 'GET', '/api/roles/usuarios', null, superTok));
  checkStatus('GET roles/usuarios sin superadmin (403)',
    await api(CI4, 'GET', '/api/roles/usuarios', null, adminTok),
    await api(NEST, 'GET', '/api/roles/usuarios', null, adminTok));

  // ── UPDATE permisos de un rol (muta permisos_rol_modulo) ──
  console.log('\n── PUT roles/:rol/permisos (superadmin) ──');
  const updateOp = async (base, modulos) => {
    // snapshot del rol operador
    const before = (await q(`SELECT modulo, activo FROM permisos_rol_modulo WHERE rol='operador' ORDER BY modulo`));
    const r = await api(base, 'PUT', '/api/roles/operador/permisos', { modulos }, superTok);
    const after = (await q(`SELECT modulo FROM permisos_rol_modulo WHERE rol='operador' AND activo=1 ORDER BY modulo`)).map(x => x.modulo);
    // restaurar
    await q(`DELETE FROM permisos_rol_modulo WHERE rol='operador'`);
    if (before.length) {
      const vals = before.map(() => '(?,?,?)').join(',');
      const params = [];
      before.forEach(b => params.push('operador', b.modulo, b.activo));
      await q(`INSERT INTO permisos_rol_modulo (rol, modulo, activo) VALUES ${vals}`, params);
    }
    return { status: r.status, body: r.body, dbModulos: after };
  };
  checkFull('PUT operador permisos (reemplaza + persiste)',
    await updateOp(CI4, ['catalogo', 'compras', 'catalogo']),  // con duplicado a propósito
    await updateOp(NEST, ['catalogo', 'compras', 'catalogo']));
  checkStatus('PUT permisos sin superadmin (403)',
    await api(CI4, 'PUT', '/api/roles/operador/permisos', { modulos: ['x'] }, adminTok),
    await api(NEST, 'PUT', '/api/roles/operador/permisos', { modulos: ['x'] }, adminTok));
  checkStatus('PUT permisos rol inválido (400)',
    await api(CI4, 'PUT', '/api/roles/pepe/permisos', { modulos: ['x'] }, superTok),
    await api(NEST, 'PUT', '/api/roles/pepe/permisos', { modulos: ['x'] }, superTok));
  checkStatus('PUT permisos modulos no-array (400)',
    await api(CI4, 'PUT', '/api/roles/operador/permisos', { modulos: 'nope' }, superTok),
    await api(NEST, 'PUT', '/api/roles/operador/permisos', { modulos: 'nope' }, superTok));

  // ── cambiarRol (muta usuarios.rol + token_version) ──
  console.log('\n── PATCH roles/usuarios/:id/rol (superadmin) ──');
  const cambiarOp = async (base) => {
    await q(`UPDATE usuarios SET rol='operador', token_version=1 WHERE id_usuarios=?`, [TESTUID]);
    const r = await api(base, 'PATCH', `/api/roles/usuarios/${TESTUID}/rol`, { rol: 'visor' }, superTok);
    const row = (await q(`SELECT rol, token_version FROM usuarios WHERE id_usuarios=?`, [TESTUID]))[0];
    return { status: r.status, body: r.body, dbRol: row.rol, tv: Number(row.token_version) };
  };
  checkFull('PATCH cambiarRol (rol + tv++)', await cambiarOp(CI4), await cambiarOp(NEST));
  checkStatus('PATCH cambiarRol sin superadmin (403)',
    await api(CI4, 'PATCH', `/api/roles/usuarios/${TESTUID}/rol`, { rol: 'visor' }, adminTok),
    await api(NEST, 'PATCH', `/api/roles/usuarios/${TESTUID}/rol`, { rol: 'visor' }, adminTok));
  checkStatus('PATCH cambiarRol rol inválido (400)',
    await api(CI4, 'PATCH', `/api/roles/usuarios/${TESTUID}/rol`, { rol: 'jefe' }, superTok),
    await api(NEST, 'PATCH', `/api/roles/usuarios/${TESTUID}/rol`, { rol: 'jefe' }, superTok));
  checkStatus('PATCH cambiarRol usuario inexistente (404)',
    await api(CI4, 'PATCH', `/api/roles/usuarios/99999/rol`, { rol: 'visor' }, superTok),
    await api(NEST, 'PATCH', `/api/roles/usuarios/99999/rol`, { rol: 'visor' }, superTok));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanup().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
