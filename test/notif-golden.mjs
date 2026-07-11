// Golden harness de NOTIFICACIONES (NotificacionesController): index (+lazy-cron), no-leidas,
// marcar leída, leer-todas. Ambos leen la misma BD → comparaciones directas. Errores {ok,msg}.
//
// Uso: TOKEN_SECRET=... node test/notif-golden.mjs

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
function checkStatus(name, ci4, nest) { if (ci4.status === nest.status) { pass++; console.log(`  ✅ ${name} (status ${ci4.status})`); } else { fail++; console.log(`  ❌ ${name}: status ${ci4.status} (CI4) != ${nest.status} (Nest)`); } }
function expect(name, cond, got) { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name} → ${JSON.stringify(got)}`); } }

const adminTok = mint(2, 'root', 'admin', (await q(`SELECT token_version FROM usuarios WHERE id_usuarios=2`))[0].token_version);

async function seed(rol, titulo, leida = 0) {
  const r = await q(`INSERT INTO notificaciones (user_id, rol_target, tipo, titulo, mensaje, link, leida, metadata, created_at) VALUES (NULL, ?, 'info', ?, 'msg', '/x', ?, JSON_OBJECT('k','v'), NOW())`, [rol, titulo, leida]);
  return r.insertId;
}
async function cleanupSeeds() { await q(`DELETE FROM notificaciones WHERE titulo LIKE 'ZZ_NOTIF%'`); }

try {
  await cleanupSeeds();
  // Estabilizar las automáticas (lazy-cron) con una llamada previa a CI4 index.
  await api(CI4, 'GET', '/api/notificaciones', null, adminTok);
  // Seeds visibles para admin: rol admin, global(null); y uno de operador (NO visible).
  const a1 = await seed('admin', 'ZZ_NOTIF_ADMIN_1');
  const a2 = await seed(null, 'ZZ_NOTIF_GLOBAL');
  const a3 = await seed('operador', 'ZZ_NOTIF_OPER'); // no visible para admin
  console.log(`\nSeeds: admin=${a1}, global=${a2}, operador=${a3}\n`);

  // ── INDEX ──
  console.log('── index / no-leidas ──');
  check('GET notificaciones (data + no_leidas)',
    await api(CI4, 'GET', '/api/notificaciones?limit=50', null, adminTok),
    await api(NEST, 'GET', '/api/notificaciones?limit=50', null, adminTok));
  check('GET notificaciones?solo_no_leidas=1',
    await api(CI4, 'GET', '/api/notificaciones?solo_no_leidas=1&limit=50', null, adminTok),
    await api(NEST, 'GET', '/api/notificaciones?solo_no_leidas=1&limit=50', null, adminTok));
  check('GET notificaciones/no-leidas',
    await api(CI4, 'GET', '/api/notificaciones/no-leidas', null, adminTok),
    await api(NEST, 'GET', '/api/notificaciones/no-leidas', null, adminTok));

  // Verificar que el operador-target NO aparece para admin
  const idxN = await api(NEST, 'GET', '/api/notificaciones?limit=100', null, adminTok);
  const titulos = (idxN.body?.data ?? []).map(x => x.titulo);
  expect('scoping: operador-target NO visible para admin', titulos.includes('ZZ_NOTIF_ADMIN_1') && titulos.includes('ZZ_NOTIF_GLOBAL') && !titulos.includes('ZZ_NOTIF_OPER'), { adminSeen: titulos.includes('ZZ_NOTIF_ADMIN_1'), operSeen: titulos.includes('ZZ_NOTIF_OPER') });

  // ── MARCAR LEÍDA ── (una seed por backend)
  console.log('\n── marcar leída ──');
  const marcarOp = async (base) => {
    const id = await seed('admin', 'ZZ_NOTIF_MARK');
    const r = await api(base, 'PATCH', `/api/notificaciones/${id}/leer`, null, adminTok);
    const row = (await q(`SELECT leida, leida_at FROM notificaciones WHERE id=?`, [id]))[0];
    await q(`DELETE FROM notificaciones WHERE id=?`, [id]);
    return { status: r.status, body: r.body, dbLeida: Number(row.leida), leidaAtSet: row.leida_at != null };
  };
  check('PATCH :id/leer', await marcarOp(CI4), await marcarOp(NEST));
  // CI4 quirk: update() devuelve bool → marcarLeida SIEMPRE 200 {ok:true} (404 muerto). Se replica.
  check('PATCH inexistente (200 {ok:true}, quirk CI4)',
    await api(CI4, 'PATCH', '/api/notificaciones/99999999/leer', null, adminTok),
    await api(NEST, 'PATCH', '/api/notificaciones/99999999/leer', null, adminTok));
  check('PATCH fuera de scope (operador→admin, 200, quirk CI4)',
    await api(CI4, 'PATCH', `/api/notificaciones/${a3}/leer`, null, adminTok),
    await api(NEST, 'PATCH', `/api/notificaciones/${a3}/leer`, null, adminTok));

  // ── LEER TODAS ── baseline: marcar todo leído, sembrar 3, contar
  console.log('\n── leer-todas ──');
  const leerTodasOp = async (base) => {
    // baseline: todo el scope admin queda leído
    await q(`UPDATE notificaciones SET leida=1 WHERE leida=0 AND (rol_target='admin' OR rol_target IS NULL OR user_id=2)`);
    const ids = [await seed('admin', 'ZZ_NOTIF_LT1'), await seed(null, 'ZZ_NOTIF_LT2'), await seed('admin', 'ZZ_NOTIF_LT3')];
    const r = await api(base, 'POST', '/api/notificaciones/leer-todas', {}, adminTok);
    const stillUnread = (await q(`SELECT COUNT(*) n FROM notificaciones WHERE id IN (?,?,?) AND leida=0`, ids))[0].n;
    await q(`DELETE FROM notificaciones WHERE id IN (?,?,?)`, ids);
    return { status: r.status, marcadas: r.body?.marcadas, stillUnread: Number(stillUnread) };
  };
  check('POST leer-todas (marca 3)', await leerTodasOp(CI4), await leerTodasOp(NEST));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanupSeeds().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
