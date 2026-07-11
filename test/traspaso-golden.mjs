// Golden de TRASPASO: verifica que mover stock entre bodegas en Nest reubica las
// capas (FIFO, preservando costo) igual que CI4.
// Fixture: 2 capas en bodega origen (30@1000, 50@2000). Traspasa 40 → destino.
// Esperado: capa1 (30@1000) entera a destino; capa2 origen queda 40, partial 10@2000 a destino.
// Uso: TOKEN_SECRET=... node test/traspaso-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['inventario-global'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));

let itemId, capa1, capa2, ORI = 1, DEST;

async function setup() {
  DEST = (await q(`SELECT id_bodegas FROM bodegas WHERE deleted_at IS NULL AND id_bodegas<>1 ORDER BY id_bodegas LIMIT 1`))[0].id_bodegas;
  itemId = (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES ('ZZ TRASP','ZZTR',1,'',0)`)).insertId;
  capa1 = (await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,?,23,30,30,1000,1,DATE_SUB(NOW(),INTERVAL 2 DAY),1)`, [itemId, ORI])).insertId;
  capa2 = (await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,?,23,50,50,2000,1,NOW(),1)`, [itemId, ORI])).insertId;
}

async function capasDe(bodega) {
  const rows = await q(`SELECT costo_unitario,cantidad_disponible FROM inventario_capas WHERE item_general_id=? AND bodegas_id=? AND estado=1 ORDER BY costo_unitario,cantidad_disponible`, [itemId, bodega]);
  return rows.map(r => ({ costo: n(r.costo_unitario), disp: n(r.cantidad_disponible) }));
}
async function capture() {
  const c1 = (await q(`SELECT bodegas_id,cantidad_disponible FROM inventario_capas WHERE id_capa=?`, [capa1]))[0];
  const c2 = (await q(`SELECT bodegas_id,cantidad_disponible FROM inventario_capas WHERE id_capa=?`, [capa2]))[0];
  const mov = (await q(`SELECT tipo_movimiento,cantidad,saldo_anterior,saldo_nuevo,referencia_tipo FROM movimiento_inventario WHERE item_general_id=? AND referencia_tipo='TRASPASO_BODEGA' ORDER BY id_movimiento_inventario DESC LIMIT 1`, [itemId]))[0] || null;
  return {
    origen: await capasDe(ORI),
    destino: await capasDe(DEST),
    capa1: { bodega: n(c1.bodegas_id), disp: n(c1.cantidad_disponible) },
    capa2: { bodega: n(c2.bodegas_id), disp: n(c2.cantidad_disponible) },
    mov: mov && { tipo: mov.tipo_movimiento, cantidad: n(mov.cantidad), saldo_ant: n(mov.saldo_anterior), saldo_nue: n(mov.saldo_nuevo), ref: mov.referencia_tipo },
  };
}
async function restore() {
  await q(`UPDATE inventario_capas SET bodegas_id=?, cantidad_disponible=30, estado=1 WHERE id_capa=?`, [ORI, capa1]);
  await q(`UPDATE inventario_capas SET bodegas_id=?, cantidad_disponible=50, estado=1 WHERE id_capa=?`, [ORI, capa2]);
  await q(`DELETE FROM inventario_capas WHERE item_general_id=? AND id_capa NOT IN (?,?)`, [itemId, capa1, capa2]);
  await q(`DELETE FROM inventario WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM movimiento_inventario WHERE item_general_id=? AND referencia_tipo='TRASPASO_BODEGA'`, [itemId]);
}
async function teardown() {
  await restore();
  await q(`DELETE FROM inventario_capas WHERE item_general_id=?`, [itemId]);
  await q(`DELETE FROM item_general WHERE id_item_general=?`, [itemId]);
}
async function traspasar(base) {
  const r = await fetch(`${base}/api/inventario/traspaso`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: itemId, bodega_origen_id: ORI, bodega_destino_id: DEST, cantidad: 40, observaciones: 'golden' }) });
  return { status: r.status, body: await r.json().catch(() => null) };
}

try {
  await setup();
  const rc = await traspasar(CI4); const ci4 = await capture(); await restore();
  const rn = await traspasar(NEST); const nest = await capture(); await restore();

  console.log(`\n=== TRASPASO GOLDEN (origen ${ORI} → destino ${DEST}) ===\n`);
  console.log('CI4  respondió:', rc.status, JSON.stringify(rc.body));
  console.log('Nest respondió:', rn.status, JSON.stringify(rn.body));
  console.log('\n-- CI4  --\n', JSON.stringify(ci4));
  console.log('\n-- Nest --\n', JSON.stringify(nest));
  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (traspaso idéntico)' : 'DIFF ✗') + ' ===');
  if (a !== b) for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} != ${JSON.stringify(nest[k])}`);
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
