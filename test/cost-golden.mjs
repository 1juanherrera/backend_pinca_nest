// Golden harness de COSTEO: verifica que la recepción de OC en Nest produce las
// MISMAS capas/costos/movimientos que CI4, sobre un fixture controlado.
//
// Flujo: crea fixture (item + item_proveedor + OC Enviada + línea) → corre la
// recepción en CI4 → captura el estado resultante → RESTAURA → corre en Nest →
// captura → compara → teardown (borra el fixture). No toca datos reales.
//
// Requiere: DB en 127.0.0.1:13306 (forward), CI4 en :8080, Nest en :3009.
// Uso: TOKEN_SECRET=... node test/cost-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }

const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
function jwt(p) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const bd = b64(JSON.stringify(p));
  const s = b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest());
  return `${h}.${bd}.${s}`;
}
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['compras'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

let itemId, ipId, ocId, detId;

async function setup() {
  const ig = await q(
    `INSERT INTO item_general (nombre, codigo, tipo, p_kg, costo_produccion) VALUES ('ZZ RCP TEST','ZZRCP',1,'',0)`);
  itemId = ig.insertId;
  await q(`INSERT INTO costos_item (item_general_id, costo_unitario, costo_cunete, costo_tambor, metodo_calculo, volumen, estado) VALUES (?,0,0,0,'Catál',1,1)`, [itemId]);
  const ip = await q(
    `INSERT INTO item_proveedor (proveedor_id, item_general_id, nombre, factor_conversion, unidad_compra_id, precio_unitario, disponible, tipo) VALUES (23,?, 'ZZ IP TEST',25,1,50000,1,1)`, [itemId]);
  ipId = ip.insertId;
  const oc = await q(
    `INSERT INTO ordenes_compra (numero, proveedor_id, bodegas_id, fecha, estado, total, iva_pct) VALUES ('ZZ-RCP-TEST',23,1,CURDATE(),'Enviada',100000,19)`);
  ocId = oc.insertId;
  const det = await q(
    `INSERT INTO ordenes_compra_detalle (ordenes_compra_id, item_proveedor_id, item_general_id, cantidad, precio_unit, subtotal, cantidad_recibida) VALUES (?,?,?,2,50000,100000,0)`, [ocId, ipId, itemId]);
  detId = det.insertId;
}

async function captureState() {
  const capa = (await q(`SELECT cantidad_original, cantidad_disponible, costo_unitario, factor_conversion, precio_compra, unidad_compra_id, proveedor_id, item_proveedor_id, lote_proveedor, estado FROM inventario_capas WHERE orden_compra_id=? ORDER BY id_capa DESC LIMIT 1`, [ocId]))[0] || null;
  const costo = (await q(`SELECT costo_unitario, metodo_calculo FROM costos_item WHERE item_general_id=?`, [itemId]))[0] || null;
  const mov = (await q(`SELECT tipo_movimiento, cantidad, costo_unitario, saldo_anterior, saldo_nuevo, referencia_tipo, referencia_id, metadata FROM movimiento_inventario WHERE referencia_tipo='ORDEN_COMPRA' AND referencia_id=? ORDER BY id_movimiento_inventario DESC LIMIT 1`, [ocId]))[0] || null;
  const det = (await q(`SELECT cantidad_recibida, (recibido_en IS NOT NULL) AS recibida FROM ordenes_compra_detalle WHERE id_detalle=?`, [detId]))[0] || null;
  const oc = (await q(`SELECT estado FROM ordenes_compra WHERE id_orden=?`, [ocId]))[0] || null;
  const inv = (await q(`SELECT cantidad FROM inventario WHERE item_general_id=? AND bodegas_id=1`, [itemId]))[0] || null;
  const ig = (await q(`SELECT costo_produccion FROM item_general WHERE id_item_general=?`, [itemId]))[0] || null;
  return { capa, costo, mov, det, oc, inv, ig };
}

async function restore() {
  await q(`DELETE FROM inventario_capas WHERE orden_compra_id=?`, [ocId]);
  await q(`DELETE FROM movimiento_inventario WHERE referencia_tipo='ORDEN_COMPRA' AND referencia_id=?`, [ocId]);
  await q(`UPDATE ordenes_compra_detalle SET cantidad_recibida=0, recibido_en=NULL WHERE id_detalle=?`, [detId]);
  await q(`UPDATE ordenes_compra SET estado='Enviada' WHERE id_orden=?`, [ocId]);
  await q(`UPDATE costos_item SET costo_unitario=0, metodo_calculo='Catál' WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM inventario WHERE item_general_id=?`, [itemId]);
  await q(`UPDATE item_general SET costo_produccion=0 WHERE id_item_general=?`, [itemId]);
}

async function teardown() {
  await restore();
  await q(`DELETE FROM ordenes_compra_detalle WHERE id_detalle=?`, [detId]);
  await q(`DELETE FROM ordenes_compra WHERE id_orden=?`, [ocId]);
  await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [ipId]);
  await q(`DELETE FROM costos_item WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM item_general WHERE id_item_general=?`, [itemId]);
}

async function recibir(base) {
  const r = await fetch(`${base}/api/ordenes_compra/${ocId}/recibir/${detId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad_recibida: 2 }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

// comparación: normaliza números y compara los campos de costo (ignora ids/timestamps)
function norm(state) {
  const n = (x) => (x == null ? null : Number(x));
  return {
    capa: state.capa && {
      cantidad_original: n(state.capa.cantidad_original),
      cantidad_disponible: n(state.capa.cantidad_disponible),
      costo_unitario: n(state.capa.costo_unitario),
      factor_conversion: n(state.capa.factor_conversion),
      precio_compra: n(state.capa.precio_compra),
      unidad_compra_id: n(state.capa.unidad_compra_id),
      proveedor_id: n(state.capa.proveedor_id),
      item_proveedor_id: n(state.capa.item_proveedor_id),
      lote_proveedor: state.capa.lote_proveedor,
      estado: n(state.capa.estado),
    },
    costo_item: n(state.costo?.costo_unitario),
    metodo: state.costo?.metodo_calculo,
    mov: state.mov && {
      tipo: state.mov.tipo_movimiento,
      cantidad: n(state.mov.cantidad),
      costo_unitario: n(state.mov.costo_unitario),
      saldo_anterior: n(state.mov.saldo_anterior),
      saldo_nuevo: n(state.mov.saldo_nuevo),
      referencia_tipo: state.mov.referencia_tipo,
    },
    det_cantidad_recibida: n(state.det?.cantidad_recibida),
    det_recibida: n(state.det?.recibida),
    oc_estado: state.oc?.estado,
    inventario: n(state.inv?.cantidad),
    costo_produccion: n(state.ig?.costo_produccion),
  };
}

// ── ejecución ──
try {
  await setup();

  const rc = await recibir(CI4);
  const ci4 = norm(await captureState());
  await restore();

  const rn = await recibir(NEST);
  const nest = norm(await captureState());
  await restore();

  console.log('\n=== COST GOLDEN: recepción OC — Nest vs CI4 ===\n');
  console.log('CI4  respondió:', rc.status, JSON.stringify(rc.body));
  console.log('Nest respondió:', rn.status, JSON.stringify(rn.body));
  console.log('\n-- Estado resultante CI4  --\n', JSON.stringify(ci4, null, 0));
  console.log('\n-- Estado resultante Nest --\n', JSON.stringify(nest, null, 0));

  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (capas/costos idénticos)' : 'DIFF ✗') + ' ===');
  if (a !== b) {
    for (const k of Object.keys(ci4)) {
      if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) {
        console.log(`  ${k}: ${JSON.stringify(ci4[k])} (CI4) != ${JSON.stringify(nest[k])} (Nest)`);
      }
    }
  }
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
