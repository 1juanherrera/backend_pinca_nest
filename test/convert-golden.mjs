// Golden de CONVERTIR: cotización→factura y remisión→factura. Verifica que Nest
// crea la MISMA factura (numeración, montos, IVA, líneas) y marca el doc origen
// igual que CI4. Uso: TOKEN_SECRET=... node test/convert-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['comercial'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));
const post = async (base, path) => { const r = await fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: '{}' }); return { status: r.status, body: await r.json().catch(() => null) }; };

let facNumBefore;
async function facNum() { return (await q(`SELECT proximo_numero FROM numeracion_documentos WHERE tipo_doc='factura'`))[0].proximo_numero; }

// normaliza una factura (excluye id/creado_en)
function normFac(f, det) {
  return {
    numero: f.numero, cliente_id: n(f.cliente_id), subtotal: n(f.subtotal), descuento: n(f.descuento),
    impuestos: n(f.impuestos), retencion: n(f.retencion), total: n(f.total), saldo: n(f.saldo_pendiente),
    estado: f.estado, obs: f.observaciones, venc: String(f.fecha_vencimiento),
    det: det.map(d => ({ desc: d.descripcion, cant: n(d.cantidad), pu: n(d.precio_unit), dpct: n(d.descuento_pct), sub: n(d.subtotal) })),
  };
}

async function facByNumero(numero) {
  const f = (await q(`SELECT * FROM facturas WHERE numero=?`, [numero]))[0];
  if (!f) return null;
  const det = await q(`SELECT descripcion,cantidad,precio_unit,descuento_pct,subtotal FROM facturas_detalle WHERE facturas_id=? ORDER BY id_detalle`, [f.id_facturas]);
  return { f, det, id: f.id_facturas };
}
async function delFac(numero) {
  const f = (await q(`SELECT id_facturas FROM facturas WHERE numero=?`, [numero]))[0];
  if (f) { await q(`DELETE FROM facturas_detalle WHERE facturas_id=?`, [f.id_facturas]); await q(`DELETE FROM facturas WHERE id_facturas=?`, [f.id_facturas]); }
}

// ─────────── PART A: cotización → factura ───────────
async function testCotizacion() {
  const cot = await q(`INSERT INTO cotizaciones (numero,cliente_id,fecha_cotizacion,fecha_vencimiento,subtotal,descuento,impuestos,retencion,total,estado) VALUES ('ZZ-COT-CV',1,CURDATE(),CURDATE(),20000,0,0,0,20000,'Aceptada')`);
  const cotId = cot.insertId;
  await q(`INSERT INTO cotizaciones_detalle (cotizaciones_id,descripcion,cantidad,precio_unit,descuento_pct,subtotal) VALUES (?,'Item A',10,1500,5,14250),(?,'Item B',3,2000,0,6000)`, [cotId, cotId]);

  const run = async (base) => {
    const r = await post(base, `/api/cotizaciones/${cotId}/convertir`);
    const numero = r.body?.data?.numero;
    const fac = await facByNumero(numero);
    const cotState = (await q(`SELECT estado,(facturas_id IS NOT NULL) AS conv FROM cotizaciones WHERE id_cotizaciones=?`, [cotId]))[0];
    const state = fac ? { ...normFac(fac.f, fac.det), cot_estado: cotState.estado, cot_conv: n(cotState.conv) } : { error: r.body };
    // restore (limpiar FK del origen ANTES de borrar la factura)
    await q(`UPDATE cotizaciones SET estado='Aceptada', facturas_id=NULL WHERE id_cotizaciones=?`, [cotId]);
    if (numero) await delFac(numero);
    await q(`UPDATE numeracion_documentos SET proximo_numero=? WHERE tipo_doc='factura'`, [facNumBefore]);
    return { status: r.status, state };
  };

  const ci4 = await run(CI4);
  const nest = await run(NEST);
  await q(`DELETE FROM cotizaciones_detalle WHERE cotizaciones_id=?`, [cotId]);
  await q(`DELETE FROM cotizaciones WHERE id_cotizaciones=?`, [cotId]);

  const ok = JSON.stringify(ci4.state) === JSON.stringify(nest.state);
  console.log(`\n[A] Cotización→Factura: CI4 ${ci4.status} / Nest ${nest.status} → ${ok ? 'MATCH ✓' : 'DIFF ✗'}`);
  console.log('  CI4 :', JSON.stringify(ci4.state));
  console.log('  Nest:', JSON.stringify(nest.state));
  if (!ok) for (const k of Object.keys(ci4.state)) if (JSON.stringify(ci4.state[k]) !== JSON.stringify(nest.state[k])) console.log(`    ${k}: ${JSON.stringify(ci4.state[k])} != ${JSON.stringify(nest.state[k])}`);
  return ok;
}

// ─────────── PART B: remisión → factura ───────────
async function testRemision() {
  const rem = await q(`INSERT INTO remisiones (numero,cliente_id,fecha_remision,estado) VALUES ('ZZ-REM-CV',1,CURDATE(),'Pendiente')`);
  const remId = rem.insertId;
  await q(`INSERT INTO remisiones_detalle (remisiones_id,descripcion,cantidad,precio_unit,subtotal) VALUES (?,'Prod X',2,5000,10000),(?,'Prod Y',1,3000,3000)`, [remId, remId]);

  const run = async (base) => {
    const r = await post(base, `/api/remisiones/${remId}/convertir`);
    const numero = r.body?.data?.numero;
    const fac = await facByNumero(numero);
    const remState = (await q(`SELECT estado,(facturas_id IS NOT NULL) AS conv FROM remisiones WHERE id_remisiones=?`, [remId]))[0];
    const state = fac ? { ...normFac(fac.f, fac.det), rem_estado: remState.estado, rem_conv: n(remState.conv) } : { error: r.body };
    await q(`UPDATE remisiones SET estado='Pendiente', facturas_id=NULL WHERE id_remisiones=?`, [remId]);
    if (numero) await delFac(numero);
    await q(`UPDATE numeracion_documentos SET proximo_numero=? WHERE tipo_doc='factura'`, [facNumBefore]);
    return { status: r.status, state };
  };

  const ci4 = await run(CI4);
  const nest = await run(NEST);
  await q(`DELETE FROM remisiones_detalle WHERE remisiones_id=?`, [remId]);
  await q(`DELETE FROM remisiones WHERE id_remisiones=?`, [remId]);

  const ok = JSON.stringify(ci4.state) === JSON.stringify(nest.state);
  console.log(`\n[B] Remisión→Factura (con IVA): CI4 ${ci4.status} / Nest ${nest.status} → ${ok ? 'MATCH ✓' : 'DIFF ✗'}`);
  console.log('  CI4 :', JSON.stringify(ci4.state));
  console.log('  Nest:', JSON.stringify(nest.state));
  if (!ok) for (const k of Object.keys(ci4.state)) if (JSON.stringify(ci4.state[k]) !== JSON.stringify(nest.state[k])) console.log(`    ${k}: ${JSON.stringify(ci4.state[k])} != ${JSON.stringify(nest.state[k])}`);
  return ok;
}

try {
  facNumBefore = await facNum();
  console.log('=== CONVERT GOLDEN ===');
  const a = await testCotizacion();
  const b = await testRemision();
  console.log(`\n=== RESUMEN: ${(a && b) ? 'TODO MATCH ✓' : 'HAY DIFERENCIAS ✗'} ===`);
} finally {
  await q(`UPDATE numeracion_documentos SET proximo_numero=? WHERE tipo_doc='factura'`, [facNumBefore]);
  await db.end();
  console.log('(fixtures eliminados, numeración restaurada)');
}
