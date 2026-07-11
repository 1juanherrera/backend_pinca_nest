// Golden harness de AUDITORIA (login-attempts + movimientos). Read-only, admin, paginado.
// Uso: TOKEN_SECRET=... node test/auditoria-golden.mjs
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const mint = (id, u, rol, tv) => { const n = Math.floor(Date.now() / 1000); return jwt({ iat: n, exp: n + 3600, data: { id, username: u, nombre: null, rol, modulos: [], token_version: tv } }); };
const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
async function api(base, path, token) { const r = await fetch(base + path, { headers: { Authorization: `Bearer ${token}` } }); let j = null; try { j = await r.json(); } catch {} return { status: r.status, body: j }; }
let pass = 0, fail = 0;
function eqS(a, b) { if (a === b) return true; if (a == null && b == null) return true; if (a == null || b == null) return false; if (String(a) === String(b)) return true; const na = Number(a), nb = Number(b); return !Number.isNaN(na) && !Number.isNaN(nb) && na === nb; }
function diff(a, b, p = '') { const d = []; if (Array.isArray(a) || Array.isArray(b)) { if (!Array.isArray(a) || !Array.isArray(b)) return [`${p}: array vs no`]; if (a.length !== b.length) d.push(`${p}: len ${a.length} vs ${b.length}`); for (let i = 0; i < Math.min(a.length, b.length); i++) d.push(...diff(a[i], b[i], `${p}[${i}]`)); return d; } if (a && typeof a === 'object' && b && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { if (!(k in a)) { d.push(`${p}.${k}: solo Nest`); continue; } if (!(k in b)) { d.push(`${p}.${k}: solo CI4`); continue; } d.push(...diff(a[k], b[k], `${p}.${k}`)); } return d; } if (!eqS(a, b)) d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`); return d; }
function check(name, ci4, nest) { const d = diff(ci4, nest); if (!d.length) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name}`); d.slice(0, 8).forEach(x => console.log(`        ${x}`)); } }

try {
  const admin = mint(2, 'root', 'admin', (await q(`SELECT token_version FROM usuarios WHERE id_usuarios=2`))[0].token_version);
  const oper = mint(2, 'root', 'operador', (await q(`SELECT token_version FROM usuarios WHERE id_usuarios=2`))[0].token_version);
  // seed algunos login_attempts para tener data
  await q(`INSERT INTO login_attempts (ip_address, username_attempt) VALUES ('9.9.9.9','ZZaudit1'),('9.9.9.8','ZZaudit2'),('9.9.9.9','ZZaudit1')`);
  console.log('');

  const paths = [
    ['login-attempts default', '/api/auditoria/login-attempts'],
    ['login-attempts per_page=5', '/api/auditoria/login-attempts?per_page=5&page=1'],
    ['login-attempts filtro usuario', '/api/auditoria/login-attempts?usuario=ZZaudit'],
    ['login-attempts filtro ip', '/api/auditoria/login-attempts?ip=9.9.9.9'],
    ['login-attempts page2', '/api/auditoria/login-attempts?per_page=10&page=2'],
    ['movimientos default', '/api/auditoria/movimientos'],
    ['movimientos per_page=5', '/api/auditoria/movimientos?per_page=5'],
    ['movimientos filtro tipo=SALIDA', '/api/auditoria/movimientos?tipo=SALIDA'],
    ['movimientos filtro item', '/api/auditoria/movimientos?item=a&per_page=10'],
  ];
  for (const [name, path] of paths) {
    check(name, await api(CI4, path, admin), await api(NEST, path, admin));
  }
  check('login-attempts sin admin (403)', await api(CI4, '/api/auditoria/login-attempts', oper), await api(NEST, '/api/auditoria/login-attempts', oper));
  check('movimientos sin admin (403)', await api(CI4, '/api/auditoria/movimientos', oper), await api(NEST, '/api/auditoria/movimientos', oper));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await q(`DELETE FROM login_attempts WHERE username_attempt LIKE 'ZZaudit%'`).catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
