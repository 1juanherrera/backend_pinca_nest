// Golden harness de DASHBOARD (DashboardController::index) — 1 endpoint agregador.
// Compara Nest vs CI4 leyendo la MISMA BD. Se excluye `generated_at` (difiere por segundos).
//
// Uso: TOKEN_SECRET=... node test/dashboard-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'root', nombre: 'root', rol: 'admin', modulos: [], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

async function get(base) {
  const r = await fetch(base + '/api/dashboard', { headers: { Authorization: `Bearer ${TOKEN}` } });
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
  if (path.endsWith('.generated_at')) return d; // difiere por segundos
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

let facId;
async function setup() {
  await teardown();
  const prov = (await q(`SELECT id_proveedor FROM proveedor LIMIT 1`))[0];
  const provId = prov ? prov.id_proveedor : 1;
  const bod = (await q(`SELECT id_bodegas FROM bodegas LIMIT 1`))[0];
  const bodId = bod ? bod.id_bodegas : 1;
  const f = await q(
    `INSERT INTO facturas (numero, cliente_id, fecha_emision, fecha_vencimiento, total, saldo_pendiente, estado, subtotal, descuento, impuestos, retencion)
     VALUES ('ZZ-DASH-FAC', 1, CURDATE(), DATE_SUB(CURDATE(), INTERVAL 40 DAY), 500000, 300000, 'Pendiente', 420000, 0, 0, 0)`);
  facId = f.insertId;
  await q(`INSERT INTO facturas_detalle (facturas_id, descripcion, cantidad, subtotal) VALUES (?, 'ZZ Pintura Alfa', 10, 200000)`, [facId]);
  await q(`INSERT INTO facturas_detalle (facturas_id, descripcion, cantidad, subtotal) VALUES (?, 'ZZ Pintura Beta', 5, 220000)`, [facId]);
  await q(`INSERT INTO cotizaciones (numero, cliente_id, fecha_cotizacion, fecha_vencimiento, estado, total) VALUES ('ZZ-DASH-COT', 1, CURDATE(), CURDATE(), 'Enviada', 150000)`);
  await q(`INSERT INTO ordenes_compra (numero, proveedor_id, bodegas_id, fecha, estado, total, iva_pct, fecha_esperada) VALUES ('ZZ-DASH-OC', ?, ?, CURDATE(), 'Enviada', 80000, 19, DATE_SUB(CURDATE(), INTERVAL 5 DAY))`, [provId, bodId]);
}
async function teardown() {
  const rows = await q(`SELECT id_facturas FROM facturas WHERE numero='ZZ-DASH-FAC'`);
  for (const r of rows) await q(`DELETE FROM facturas_detalle WHERE facturas_id=?`, [r.id_facturas]);
  await q(`DELETE FROM facturas WHERE numero='ZZ-DASH-FAC'`);
  await q(`DELETE FROM cotizaciones WHERE numero='ZZ-DASH-COT'`);
  await q(`DELETE FROM ordenes_compra WHERE numero='ZZ-DASH-OC'`);
}

try {
  await setup();
  const ci4 = await get(CI4);
  const nest = await get(NEST);
  console.log(`\nHTTP: CI4 ${ci4.status} / Nest ${nest.status}`);
  console.log(`(seed: factura vencida saldo=300k, 2 detalles, cotización Enviada, OC retrasada)`);
  // sanity: aseguremos que NO es todo cero
  const tc = Number(ci4.body?.data?.cartera?.total_cartera ?? 0);
  console.log(`  cartera.total_cartera (CI4) = ${tc}  ${tc > 0 ? '(no trivial ✓)' : '(⚠ cero)'}`);

  const keys = ['cartera', 'aging_resumen', 'top_deudores', 'sincronizacion', 'ventas_mes',
    'cotizaciones', 'ocs_pendientes', 'mp_criticas', 'produccion_curso', 'movimientos_hoy',
    'top_descripciones', 'rentabilidad'];

  // success + estructura
  const okStruct = ci4.body?.success === true && nest.body?.success === true;
  if (okStruct) { pass++; console.log('  ✅ success:true en ambos'); } else { fail++; console.log('  ❌ success flag', JSON.stringify({ ci4: ci4.body?.success, nest: nest.body?.success })); }

  for (const k of keys) {
    const d = diff(ci4.body?.data?.[k], nest.body?.data?.[k], `.${k}`);
    if (d.length === 0) { pass++; console.log(`  ✅ ${k}`); }
    else { fail++; console.log(`  ❌ ${k}`); d.slice(0, 6).forEach((x) => console.log(`        ${x}`)); }
  }

  // generated_at: ambos presentes con formato datetime
  const gCi4 = ci4.body?.data?.generated_at, gNest = nest.body?.data?.generated_at;
  const reDate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (reDate.test(gCi4 || '') && reDate.test(gNest || '')) { pass++; console.log('  ✅ generated_at (formato datetime, no comparado por valor)'); }
  else { fail++; console.log(`  ❌ generated_at formato: ${JSON.stringify({ gCi4, gNest })}`); }

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await teardown().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
