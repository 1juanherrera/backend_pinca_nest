// Golden harness del BLOQUE FINANCIERO: PagosCliente + NotasCredito + Cartera + GestionesCobro.
// Compara Nest vs CI4 en lecturas y en mutaciones que tocan recalcularSaldo.
//
// Estrategia mutaciones: se corre la MISMA operación primero en CI4 y luego en Nest,
// partiendo del MISMO estado de factura (se resetea entre corridas). Para NC además se
// resetea el contador de numeracion_documentos para que ambos emitan el mismo NC-###.
//
// Uso: TOKEN_SECRET=... node test/finanzas-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = process.env.CI4 || 'http://127.0.0.1:8080';
const NEST = process.env.NEST || 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['comercial'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

async function api(base, method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch { j = null; }
  return { status: r.status, body: j };
}

// ── comparación con coerción escalar (CI4 string vs Nest nativo) ──
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

// ── fixture ──
let facId, cliId = 1;
const TOTAL = 100000;
const HOY = new Date().toISOString().slice(0, 10);

async function crearFactura() {
  const r = await q(
    `INSERT INTO facturas (numero, cliente_id, fecha_emision, fecha_vencimiento, total, saldo_pendiente, estado, subtotal, descuento, impuestos, retencion)
     VALUES ('ZZ-GOLD-FAC', ?, ?, ?, ?, ?, 'Pendiente', ?, 0, 0, 0)`,
    [cliId, HOY, HOY, TOTAL, TOTAL, TOTAL],
  );
  return r.insertId;
}
async function resetFactura() {
  await q(`UPDATE facturas SET saldo_pendiente=?, estado='Pendiente' WHERE id_facturas=?`, [TOTAL, facId]);
  await q(`DELETE FROM pagos_cliente WHERE facturas_id=?`, [facId]);
  await q(`DELETE FROM notas_credito WHERE facturas_id=?`, [facId]);
}
async function getNumeracion() {
  const r = (await q(`SELECT proximo_numero, anio_actual FROM numeracion_documentos WHERE tipo_doc='nota_credito'`))[0];
  return { prox: r.proximo_numero, anio: r.anio_actual };
}
async function setNumeracion(s) {
  await q(`UPDATE numeracion_documentos SET proximo_numero=?, anio_actual=? WHERE tipo_doc='nota_credito'`, [s.prox, s.anio]);
}
async function facturaState() {
  const f = (await q(`SELECT saldo_pendiente, estado FROM facturas WHERE id_facturas=?`, [facId]))[0];
  return { saldo: Number(f.saldo_pendiente), estado: f.estado };
}
const clean = (row, drop) => { const o = { ...row }; for (const k of drop) delete o[k]; return o; };

// ── comparación de mutación: corre op en un backend, captura, revierte ──
async function runMutation(base, opFn) {
  await resetFactura();
  const numAntes = await getNumeracion();
  const captured = await opFn(base);
  const num = await getNumeracion();
  captured._numeracion_avanzo = num.prox - numAntes.prox;
  await setNumeracion(numAntes);
  await resetFactura();
  return captured;
}
async function golden(name, opFn) {
  const ci4 = await runMutation(CI4, opFn);
  const nest = await runMutation(NEST, opFn);
  check(name, ci4, nest);
}

// ── operaciones ──
const pagoOp = (monto) => async (base) => {
  const res = await api(base, 'POST', '/api/pagos_cliente', {
    clientes_id: cliId, facturas_id: facId, monto, fecha_pago: HOY, metodo_pago: 'efectivo',
  });
  const pago = res.body?.data ? clean(res.body.data, ['id_pagos_cliente', 'creado_en', 'usuario_id']) : null;
  return { httpStatus: res.status, msg: res.body?.message, pago, factura: await facturaState() };
};

const notaOp = (monto) => async (base) => {
  const res = await api(base, 'POST', '/api/notas_credito', {
    facturas_id: facId, clientes_id: cliId, fecha: HOY, monto, motivo: 'descuento comercial',
  });
  const nota = res.body?.data ? clean(res.body.data, ['id_nota_credito', 'creado_en', 'usuario_id']) : null;
  return { httpStatus: res.status, msg: res.body?.message, nota, factura: await facturaState() };
};

const notaAnularOp = async (base) => {
  // crea la NC directamente (mismo estado inicial) y luego anula por endpoint
  const numAntes = await getNumeracion();
  const ins = await q(
    `INSERT INTO notas_credito (numero, facturas_id, clientes_id, fecha, monto, motivo, estado)
     VALUES ('NC-ZZ', ?, ?, ?, 30000, 'x', 'Activa')`,
    [facId, cliId, HOY],
  );
  // aplicar su efecto al saldo como lo dejaría un create real
  await q(`UPDATE facturas SET saldo_pendiente=?, estado='Parcial' WHERE id_facturas=?`, [TOTAL - 30000, facId]);
  const res = await api(base, 'PATCH', `/api/notas_credito/${ins.insertId}/anular`);
  const nota = (await q(`SELECT estado FROM notas_credito WHERE id_nota_credito=?`, [ins.insertId]))[0];
  const out = { httpStatus: res.status, msg: res.body?.message, notaEstado: nota?.estado, factura: await facturaState() };
  await q(`DELETE FROM notas_credito WHERE id_nota_credito=?`, [ins.insertId]);
  await setNumeracion(numAntes);
  return out;
};

// ── gestiones_cobro: create/update/delete ──
async function gestionGolden() {
  const op = async (base) => {
    const c = await api(base, 'POST', '/api/gestiones_cobro', {
      facturas_id: facId, clientes_id: cliId, tipo: 'llamada', resultado: 'sin respuesta',
    });
    const id = c.body?.data?.id_gestion;
    const created = c.body?.data ? clean(c.body.data, ['id_gestion', 'creado_en']) : null;
    const u = await api(base, 'PUT', `/api/gestiones_cobro/${id}`, { resultado: 'contactado', tipo: 'email' });
    const updated = u.body?.data ? clean(u.body.data, ['id_gestion', 'creado_en']) : null;
    const d = await api(base, 'DELETE', `/api/gestiones_cobro/${id}`);
    const gone = (await q(`SELECT COUNT(*) n FROM gestiones_cobro WHERE id_gestion=?`, [id]))[0].n;
    return {
      createStatus: c.status, createMsg: c.body?.message, created,
      updateStatus: u.status, updateMsg: u.body?.message?.replace(String(id), '{id}'), updated,
      deleteStatus: d.status, deleteMsg: d.body?.message?.replace(String(id), '{id}'), gone: Number(gone),
    };
  };
  const ci4 = await op(CI4);
  const nest = await op(NEST);
  // el mensaje update/delete incluye el id → normalizado a {id} arriba
  check('gestiones_cobro create/update/delete', ci4, nest);
}

// ── lecturas ──
async function readGolden(name, path) {
  const ci4 = await api(CI4, 'GET', path);
  const nest = await api(NEST, 'GET', path);
  check(`${name}  (HTTP ${ci4.status}/${nest.status})`, ci4.body, nest.body);
}

// ═══════════════════════ RUN ═══════════════════════
try {
  facId = await crearFactura();
  console.log(`\nFixture: factura ${facId} (cliente ${cliId}, total ${TOTAL})\n`);

  console.log('── LECTURAS ──');
  await readGolden('cartera/resumen', '/api/cartera/resumen');
  await readGolden('cartera/aging', '/api/cartera/aging');
  await readGolden('cartera/estado_cuenta/1', `/api/cartera/estado_cuenta/${cliId}`);
  await readGolden('pagos_cliente index', '/api/pagos_cliente');
  await readGolden('notas_credito index', '/api/notas_credito');
  await readGolden('gestiones_cobro index', '/api/gestiones_cobro');

  console.log('\n── MUTACIONES (recalcularSaldo) ──');
  await golden('pago parcial (40k → saldo 60k, Parcial)', pagoOp(40000));
  await golden('pago total (100k → saldo 0, Pagada)', pagoOp(TOTAL));
  await golden('nota credito (30k → saldo 70k, NC-###)', notaOp(30000));
  await golden('anular nota credito (revierte saldo)', notaAnularOp);
  await gestionGolden();

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await resetFactura().catch(() => {});
  if (facId) await q(`DELETE FROM facturas WHERE id_facturas=?`, [facId]).catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
