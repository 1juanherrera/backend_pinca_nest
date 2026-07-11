// Golden harness de PRODUCCIÓN: verifica que crear una orden de producción en
// Nest consume las capas FIFO y congela el costo IGUAL que CI4.
//
// Fixture: producto con fórmula de 2 ingredientes (MP1 10kg, MP2 5kg), cada MP con
// una capa (MP1 100@1000, MP2 100@2000). Produce 1 galón (factor 1).
// Esperado: consume 10 de MP1 (capa→90) y 5 de MP2 (capa→95); produccion_insumos_detalle
// congela MP1 {10,1000,10000} y MP2 {5,2000,10000}.
//
// Uso: TOKEN_SECRET=... node test/prod-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['produccion'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));

let prodId, mp1, mp2, capa1, capa2, formId, unidadId;

async function setup() {
  const u = (await q(`SELECT id_unidad, escala FROM unidad WHERE estados=1 AND escala>0 ORDER BY id_unidad LIMIT 1`))[0];
  unidadId = u.id_unidad;
  const ins = async (nombre, cod, tipo) => (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,?,'',0)`, [nombre, cod, tipo])).insertId;
  prodId = await ins('ZZ PROD TEST', 'ZZPROD', 0);
  mp1 = await ins('ZZ MP1 TEST', 'ZZMP1', 1);
  mp2 = await ins('ZZ MP2 TEST', 'ZZMP2', 1);
  await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,0,0,0,1,'Catál',1)`, [prodId]);
  await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,1000,0,0,1,'Catál',1)`, [mp1]);
  await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,2000,0,0,1,'Catál',1)`, [mp2]);
  capa1 = (await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,1,23,100,100,1000,1,NOW(),1)`, [mp1])).insertId;
  capa2 = (await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,1,23,100,100,2000,1,NOW(),1)`, [mp2])).insertId;
  formId = (await q(`INSERT INTO formulaciones (nombre,estado,version_actual,item_general_id) VALUES ('ZZ FORM TEST',1,1,?)`, [prodId])).insertId;
  await q(`INSERT INTO formulaciones_versiones (formulacion_id,version_num,ingredientes,created_at) VALUES (?,1,'[]',NOW())`, [formId]);
  await q(`INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,tipo,orden) VALUES (?,?,10,'ingrediente',1)`, [formId, mp1]);
  await q(`INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,tipo,orden) VALUES (?,?,5,'ingrediente',2)`, [formId, mp2]);
}

async function captureState(prepId) {
  const c1 = (await q(`SELECT cantidad_disponible,estado FROM inventario_capas WHERE id_capa=?`, [capa1]))[0];
  const c2 = (await q(`SELECT cantidad_disponible,estado FROM inventario_capas WHERE id_capa=?`, [capa2]))[0];
  const pid = (await q(`SELECT item_general_id,cantidad,costo_unitario,subtotal FROM produccion_insumos_detalle WHERE preparacion_id=? ORDER BY item_general_id`, [prepId]));
  const phig = (await q(`SELECT item_general_id,cantidad,porcentajes FROM preparaciones_has_item_general WHERE preparaciones_id_preparaciones=? ORDER BY item_general_id`, [prepId]));
  const mov = (await q(`SELECT item_general_id,tipo_movimiento,cantidad,costo_unitario,saldo_anterior,saldo_nuevo FROM movimiento_inventario WHERE referencia_tipo='ORDEN_PRODUCCION' AND referencia_id=? ORDER BY item_general_id`, [prepId]));
  const prep = (await q(`SELECT estado,cantidad FROM preparaciones WHERE id_preparaciones=?`, [prepId]))[0];
  return {
    capa1: { disp: n(c1.cantidad_disponible), estado: n(c1.estado) },
    capa2: { disp: n(c2.cantidad_disponible), estado: n(c2.estado) },
    pid: pid.map(r => ({ item: n(r.item_general_id), cantidad: n(r.cantidad), costo_u: n(r.costo_unitario), subtotal: n(r.subtotal) })),
    phig: phig.map(r => ({ item: n(r.item_general_id), cantidad: n(r.cantidad), pct: n(r.porcentajes) })),
    mov: mov.map(r => ({ item: n(r.item_general_id), tipo: r.tipo_movimiento, cantidad: n(r.cantidad), costo_u: n(r.costo_unitario), saldo_ant: n(r.saldo_anterior), saldo_nue: n(r.saldo_nuevo) })),
    prep: { estado: n(prep.estado), cantidad: n(prep.cantidad) },
  };
}

async function cleanupPrep(prepId) {
  if (!prepId) return;
  await q(`DELETE FROM produccion_insumos_detalle WHERE preparacion_id=?`, [prepId]);
  await q(`DELETE FROM preparacion_consumo_capas WHERE preparacion_id=?`, [prepId]);
  await q(`DELETE FROM preparaciones_has_item_general WHERE preparaciones_id_preparaciones=?`, [prepId]);
  await q(`DELETE FROM preparaciones_costos_indirectos WHERE preparaciones_id=?`, [prepId]);
  await q(`DELETE FROM movimiento_inventario WHERE referencia_tipo='ORDEN_PRODUCCION' AND referencia_id=?`, [prepId]);
  await q(`DELETE FROM preparaciones WHERE id_preparaciones=?`, [prepId]);
}

async function restoreCapasInv() {
  await q(`UPDATE inventario_capas SET cantidad_disponible=100, estado=1 WHERE id_capa=?`, [capa1]);
  await q(`UPDATE inventario_capas SET cantidad_disponible=100, estado=1 WHERE id_capa=?`, [capa2]);
  await q(`DELETE FROM inventario WHERE item_general_id IN (?,?)`, [mp1, mp2]);
}

async function crear(base) {
  const r = await fetch(`${base}/api/preparaciones`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ item_general_id: prodId, cantidad: 1, unidad_id: unidadId }) });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

async function teardown() {
  await restoreCapasInv();
  await q(`DELETE FROM item_general_formulaciones WHERE formulaciones_id=?`, [formId]);
  await q(`DELETE FROM formulaciones_versiones WHERE formulacion_id=?`, [formId]);
  await q(`DELETE FROM formulaciones WHERE id_formulaciones=?`, [formId]);
  await q(`DELETE FROM inventario_capas WHERE id_capa IN (?,?)`, [capa1, capa2]);
  await q(`DELETE FROM costos_item WHERE item_general_id IN (?,?,?)`, [prodId, mp1, mp2]);
  await q(`DELETE FROM item_general WHERE id_item_general IN (?,?,?)`, [prodId, mp1, mp2]);
}

try {
  await setup();

  const rc = await crear(CI4);
  const prepCi4 = rc.body?.data?.id_preparaciones;
  const ci4 = await captureState(prepCi4);
  await cleanupPrep(prepCi4); await restoreCapasInv();

  const rn = await crear(NEST);
  const prepNest = rn.body?.data?.id_preparaciones;
  const nest = await captureState(prepNest);
  await cleanupPrep(prepNest); await restoreCapasInv();

  console.log('\n=== PROD GOLDEN: crear orden de producción — Nest vs CI4 ===\n');
  console.log('CI4  respondió:', rc.status, '(prep', prepCi4 + ')');
  console.log('Nest respondió:', rn.status, '(prep', prepNest + ')');
  console.log('\n-- CI4  --\n', JSON.stringify(ci4));
  console.log('\n-- Nest --\n', JSON.stringify(nest));

  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (producción/costeo idéntico)' : 'DIFF ✗') + ' ===');
  if (a !== b) for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} (CI4) != ${JSON.stringify(nest[k])} (Nest)`);
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
