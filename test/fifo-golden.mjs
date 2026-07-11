// Golden harness de CONSUMO FIFO: verifica que el ajuste manual (descuento FIFO)
// en Nest agota las capas y recalcula el costo IGUAL que CI4.
//
// Fixture: item con 2 capas — 30kg@1000 (vieja) + 50kg@2000 (nueva). Descuenta 40kg.
// FIFO esperado: agota capa1 (30, estado=0) + consume 10 de capa2 (queda 40, estado=1).
// costo_item recalculado = 2000 (solo queda capa2). movimiento AJUSTE cantidad=40,
// costo_unit = (30*1000+10*2000)/40 = 1250.
//
// Uso: TOKEN_SECRET=... node test/fifo-golden.mjs

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
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['inventario-global'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

let itemId, capa1, capa2;

async function setup() {
  const ig = await q(`INSERT INTO item_general (nombre, codigo, tipo, p_kg, costo_produccion) VALUES ('ZZ FIFO TEST','ZZFIFO',1,'',0)`);
  itemId = ig.insertId;
  await q(`INSERT INTO costos_item (item_general_id, costo_unitario, costo_cunete, costo_tambor, metodo_calculo, volumen, estado) VALUES (?,0,0,0,'Catál',1,1)`, [itemId]);
  // capa1: más vieja (FIFO primero), 30 @ 1000
  const c1 = await q(`INSERT INTO inventario_capas (item_general_id, bodegas_id, proveedor_id, cantidad_original, cantidad_disponible, costo_unitario, factor_conversion, fecha_ingreso, estado) VALUES (?,1,23,30,30,1000,1, DATE_SUB(NOW(), INTERVAL 2 DAY), 1)`, [itemId]);
  capa1 = c1.insertId;
  // capa2: más nueva, 50 @ 2000
  const c2 = await q(`INSERT INTO inventario_capas (item_general_id, bodegas_id, proveedor_id, cantidad_original, cantidad_disponible, costo_unitario, factor_conversion, fecha_ingreso, estado) VALUES (?,1,23,50,50,2000,1, NOW(), 1)`, [itemId]);
  capa2 = c2.insertId;
}

async function captureState() {
  const c1 = (await q(`SELECT cantidad_disponible, estado FROM inventario_capas WHERE id_capa=?`, [capa1]))[0];
  const c2 = (await q(`SELECT cantidad_disponible, estado FROM inventario_capas WHERE id_capa=?`, [capa2]))[0];
  const costo = (await q(`SELECT costo_unitario FROM costos_item WHERE item_general_id=?`, [itemId]))[0];
  const mov = (await q(`SELECT tipo_movimiento, cantidad, costo_unitario, saldo_anterior, saldo_nuevo, referencia_tipo, metadata FROM movimiento_inventario WHERE item_general_id=? AND referencia_tipo='AJUSTE_MANUAL' ORDER BY id_movimiento_inventario DESC LIMIT 1`, [itemId]))[0] || null;
  const n = (x) => (x == null ? null : Number(x));
  return {
    capa1: { disp: n(c1.cantidad_disponible), estado: n(c1.estado) },
    capa2: { disp: n(c2.cantidad_disponible), estado: n(c2.estado) },
    costo_item: n(costo?.costo_unitario),
    mov: mov && { tipo: mov.tipo_movimiento, cantidad: n(mov.cantidad), costo_unitario: n(mov.costo_unitario), saldo_anterior: n(mov.saldo_anterior), saldo_nuevo: n(mov.saldo_nuevo), referencia_tipo: mov.referencia_tipo, metadata: mov.metadata },
  };
}

async function restore() {
  await q(`UPDATE inventario_capas SET cantidad_disponible=30, estado=1 WHERE id_capa=?`, [capa1]);
  await q(`UPDATE inventario_capas SET cantidad_disponible=50, estado=1 WHERE id_capa=?`, [capa2]);
  await q(`DELETE FROM movimiento_inventario WHERE item_general_id=? AND referencia_tipo='AJUSTE_MANUAL'`, [itemId]);
  await q(`UPDATE costos_item SET costo_unitario=0, metodo_calculo='Catál' WHERE item_general_id=?`, [itemId]);
}

async function teardown() {
  await restore();
  await q(`DELETE FROM movimiento_inventario WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM inventario_capas WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM costos_item WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM item_general WHERE id_item_general=?`, [itemId]);
}

async function ajustar(base) {
  const r = await fetch(`${base}/api/inventario/ajuste-manual`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_general_id: itemId, bodega_id: 1, cantidad: 40, motivo: 'conteo', observacion: 'golden' }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}

try {
  await setup();

  const rc = await ajustar(CI4);
  const ci4 = await captureState();
  await restore();

  const rn = await ajustar(NEST);
  const nest = await captureState();
  await restore();

  console.log('\n=== FIFO GOLDEN: ajuste manual (consumo FIFO) — Nest vs CI4 ===\n');
  console.log('CI4  respondió:', rc.status, JSON.stringify(rc.body));
  console.log('Nest respondió:', rn.status, JSON.stringify(rn.body));
  console.log('\n-- CI4  --\n', JSON.stringify(ci4));
  console.log('\n-- Nest --\n', JSON.stringify(nest));

  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (FIFO idéntico)' : 'DIFF ✗') + ' ===');
  if (a !== b) for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} (CI4) != ${JSON.stringify(nest[k])} (Nest)`);
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
