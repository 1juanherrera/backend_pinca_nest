// Golden/contract test: compara la respuesta de Nest vs CI4 endpoint por endpoint.
// Ambos backends comparten TOKEN_SECRET, así que el mismo Bearer sirve para los dos.
//
// Uso: node test/golden-compare.mjs
//   CI4=http://127.0.0.1:8080  NEST=http://127.0.0.1:3009  (defaults)
//
// Comparación LOOSE: coacciona escalares a string antes de comparar (CI4 devuelve
// todo string vía getResultArray; Nest devuelve tipos nativos). Ignora el orden de
// claves. Reporta MATCH / DIFF-VALOR / DIFF-ESTRUCTURA / SOLO-TIPO.

import crypto from 'node:crypto';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

// ── JWT HS256 compatible con CI4 (payload anidado en data) ──
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function jwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'root', nombre: 'root', rol: 'admin', modulos: ['catalogo', 'compras', 'comercial'], token_version: 1 } });

async function get(base, path) {
  const r = await fetch(base + path, { headers: { Authorization: `Bearer ${TOKEN}` } });
  let body = null;
  try { body = await r.json(); } catch { body = null; }
  return { status: r.status, body };
}

// ── comparación estructural con coerción escalar ──
let typeOnlyCount = 0;
function scalarEq(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  // coerción string (tolera "5" vs 5, "20250.00" vs 20250)
  const sa = String(a), sb = String(b);
  if (sa === sb) { typeOnlyCount++; return true; }
  // números equivalentes con distinta forma decimal
  const na = Number(a), nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na === nb) { typeOnlyCount++; return true; }
  return false;
}
function deepDiff(a, b, path = '') {
  const diffs = [];
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) { diffs.push(`${path}: tipo array vs no-array`); return diffs; }
    if (a.length !== b.length) diffs.push(`${path}: longitud ${a.length} (CI4) vs ${b.length} (Nest)`);
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) diffs.push(...deepDiff(a[i], b[i], `${path}[${i}]`));
    return diffs;
  }
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a)) { diffs.push(`${path}.${k}: falta en CI4 (solo Nest)`); continue; }
      if (!(k in b)) { diffs.push(`${path}.${k}: falta en Nest (solo CI4)`); continue; }
      diffs.push(...deepDiff(a[k], b[k], `${path}.${k}`));
    }
    return diffs;
  }
  if (!scalarEq(a, b)) diffs.push(`${path}: ${JSON.stringify(a)} (CI4) != ${JSON.stringify(b)} (Nest)`);
  return diffs;
}

// endpoints de lectura a comparar (los que Nest ya migró)
const LIST_ENDPOINTS = [
  '/api/unidades', '/api/categorias', '/api/bodegas', '/api/instalaciones',
  '/api/proveedores', '/api/clientes', '/api/numeracion',
  '/api/cotizaciones', '/api/facturas', '/api/catalogo',
  '/api/ordenes_compra', '/api/remisiones',
  // Fase 3 (lecturas):
  '/api/inventario/global', '/api/inventario/capas/bodegas', '/api/movimientos',
  // Sincronización (no-IA):
  '/api/sincronizacion/stats', '/api/sincronizacion/maestro',
  '/api/sincronizacion/huerfanos', '/api/sincronizacion/duplicados',
];

const results = [];
for (const ep of LIST_ENDPOINTS) {
  typeOnlyCount = 0;
  const [c, n] = await Promise.all([get(CI4, ep), get(NEST, ep)]);
  if (c.status !== n.status) {
    results.push({ ep, verdict: 'DIFF-STATUS', detail: `CI4 ${c.status} vs Nest ${n.status}` });
    continue;
  }
  const diffs = deepDiff(c.body, n.body);
  if (diffs.length === 0) {
    results.push({ ep, verdict: typeOnlyCount > 0 ? `MATCH (${typeOnlyCount} coerciones tipo)` : 'MATCH', detail: '' });
  } else {
    results.push({ ep, verdict: 'DIFF', detail: diffs.slice(0, 6).join(' | ') + (diffs.length > 6 ? ` (+${diffs.length - 6} más)` : '') });
  }
}

// detalle: tomar el primer id de catalogo y ordenes_compra desde CI4 y comparar detalle
async function compareDetail(listEp, buildDetail, idKey) {
  const c0 = await get(CI4, listEp);
  const first = Array.isArray(c0.body) ? c0.body[0] : null;
  if (!first) return;
  const id = first[idKey];
  const dp = buildDetail(id);
  typeOnlyCount = 0;
  const [c, n] = await Promise.all([get(CI4, dp), get(NEST, dp)]);
  if (c.status !== n.status) { results.push({ ep: dp, verdict: 'DIFF-STATUS', detail: `CI4 ${c.status} vs Nest ${n.status}` }); return; }
  const diffs = deepDiff(c.body, n.body);
  results.push({ ep: dp, verdict: diffs.length ? 'DIFF' : (typeOnlyCount ? `MATCH (${typeOnlyCount} coerciones tipo)` : 'MATCH'), detail: diffs.slice(0, 8).join(' | ') });
}
await compareDetail('/api/catalogo', (id) => `/api/catalogo/${id}`, 'id_item_general');
await compareDetail('/api/ordenes_compra', (id) => `/api/ordenes_compra/${id}/detalle`, 'id_orden');

// capas de un item con stock: buscar el primero con stock_total>0 en inventario/global
{
  const g = await get(CI4, '/api/inventario/global');
  const conStock = Array.isArray(g.body) ? g.body.find((x) => Number(x.stock_total) > 0) : null;
  if (conStock) {
    const dp = `/api/inventario/${conStock.id_item_general}/capas`;
    typeOnlyCount = 0;
    const [c, n] = await Promise.all([get(CI4, dp), get(NEST, dp)]);
    const diffs = c.status !== n.status ? [`status ${c.status} vs ${n.status}`] : deepDiff(c.body, n.body);
    results.push({ ep: dp, verdict: diffs.length ? 'DIFF' : (typeOnlyCount ? `MATCH (${typeOnlyCount} coerciones tipo)` : 'MATCH'), detail: diffs.slice(0, 8).join(' | ') });
  }
}

// reporte
console.log('\n=== GOLDEN COMPARE: Nest vs CI4 ===\n');
let ok = 0, bad = 0;
for (const r of results) {
  const mark = r.verdict.startsWith('MATCH') ? '✓' : '✗';
  if (r.verdict.startsWith('MATCH')) ok++; else bad++;
  console.log(`${mark} ${r.ep.padEnd(34)} ${r.verdict}`);
  if (r.detail) console.log(`    ${r.detail}`);
}
console.log(`\nResumen: ${ok} MATCH / ${bad} con diferencias (de ${results.length})`);
