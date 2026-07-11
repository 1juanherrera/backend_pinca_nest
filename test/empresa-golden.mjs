// Golden harness de EMPRESA (endpoints de DATOS: GET /empresa, PUT /empresa).
// Los endpoints de logo se quedan en CI4 (filesystem) → NO se testean acá.
// Errores usan ApiResponse {ok,msg} = filtro Nest → comparación completa.
//
// Uso: TOKEN_SECRET=... node test/empresa-golden.mjs

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
  else { fail++; console.log(`  ❌ ${name}`); d.slice(0, 10).forEach((x) => console.log(`        ${x}`)); }
}

async function snapshot() { return (await q(`SELECT * FROM empresa`))[0]; }
async function restore(snap) {
  const cols = Object.keys(snap).filter(k => k !== 'id_empresa');
  await q(`UPDATE empresa SET ${cols.map(c => `${c}=?`).join(', ')} WHERE id_empresa=?`, [...cols.map(c => snap[c]), snap.id_empresa]);
}

try {
  const admin = (await q(`SELECT id_usuarios, token_version FROM usuarios WHERE username='root' LIMIT 1`))[0];
  const adminTok = mint(admin.id_usuarios, 'root', 'admin', admin.token_version);
  const operTok = mint(admin.id_usuarios, 'root', 'operador', admin.token_version);
  const original = await snapshot();
  console.log(`\nFixture: empresa id=${original.id_empresa} (${original.razon_social})\n`);

  // ── GET ──
  console.log('── GET /empresa ──');
  check('GET empresa',
    await api(CI4, 'GET', '/api/empresa', null, adminTok),
    await api(NEST, 'GET', '/api/empresa', null, adminTok));

  // ── PUT (muta; restaura entre corridas) ──
  console.log('\n── PUT /empresa (admin) ──');
  const upd = async (base, payload) => {
    const r = await api(base, 'PUT', '/api/empresa', payload, adminTok);
    const row = await snapshot();
    await restore(original);
    return { status: r.status, body: r.body, dbLogo: row.logo_path, dbCiudad: row.ciudad };
  };
  check('PUT campos válidos (ciudad+telefono)',
    await upd(CI4, { ciudad: 'Cartagena', telefono: '3000000000' }),
    await upd(NEST, { ciudad: 'Cartagena', telefono: '3000000000' }));
  // logo_path NO debe poder setearse por payload (anti path-traversal)
  check('PUT ignora logo_path (solo actualiza nit)',
    await upd(CI4, { nit: '999', logo_path: '/evil/path' }),
    await upd(NEST, { nit: '999', logo_path: '/evil/path' }));
  check('PUT solo claves inválidas (400)',
    await api(CI4, 'PUT', '/api/empresa', { foo: 'bar' }, adminTok),
    await api(NEST, 'PUT', '/api/empresa', { foo: 'bar' }, adminTok));
  check('PUT body vacío (400 Datos inválidos)',
    await api(CI4, 'PUT', '/api/empresa', {}, adminTok),
    await api(NEST, 'PUT', '/api/empresa', {}, adminTok));
  check('PUT sin admin (403)',
    await api(CI4, 'PUT', '/api/empresa', { ciudad: 'X' }, operTok),
    await api(NEST, 'PUT', '/api/empresa', { ciudad: 'X' }, operTok));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await db.end();
}
process.exit(fail ? 1 : 0);
