// Golden de MERGE (unificar materias primas): verifica que Nest reapunta las FKs
// (item_proveedor, BOM con consolidación, capas, movimientos), borra costos_item del
// removido y lo marca [MERGED→X], igual que CI4.
// Uso: TOKEN_SECRET=... node test/merge-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['sincronizacion'], token_version: 1 } });
const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));

let keep, remove, prod, ipId, formId, capaId, movId;

async function setup() {
  const ins = async (nom, cod) => (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,1,'',0)`, [nom, cod])).insertId;
  keep = await ins('ZZ KEEP', 'ZZK');
  remove = await ins('ZZ REMOVE', 'ZZR');
  prod = (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES ('ZZ PRODM','ZZPM',0,'',0)`)).insertId;
  await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,1000,0,0,1,'Catál',1)`, [keep]);
  await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,2000,0,0,1,'Catál',1)`, [remove]);
  ipId = (await q(`INSERT INTO item_proveedor (proveedor_id,item_general_id,nombre,factor_conversion,precio_unitario,disponible,tipo) VALUES (23,?,'ZZ IP',1,5000,1,1)`, [remove])).insertId;
  formId = (await q(`INSERT INTO formulaciones (nombre,estado,version_actual,item_general_id) VALUES ('ZZ FM',1,1,?)`, [prod])).insertId;
  await q(`INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,orden,tipo) VALUES (?,?,5,1,'ingrediente')`, [formId, keep]);
  await q(`INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,orden,tipo) VALUES (?,?,10,2,'ingrediente')`, [formId, remove]);
  capaId = (await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,1,23,20,0,2000,1,NOW(),0)`, [remove])).insertId; // AGOTADA (sin stock activo)
  movId = (await q(`INSERT INTO movimiento_inventario (tipo_movimiento,cantidad,fecha_movimiento,item_general_id,bodega_id,referencia_tipo,saldo_anterior,saldo_nuevo,created_at) VALUES ('AJUSTE',5,NOW(),?,1,'AJUSTE_MANUAL',5,0,NOW())`, [remove])).insertId;
}

async function capture() {
  const ip = n((await q(`SELECT item_general_id FROM item_proveedor WHERE id_item_proveedor=?`, [ipId]))[0]?.item_general_id);
  const igf = (await q(`SELECT item_general_id,cantidad FROM item_general_formulaciones WHERE formulaciones_id=? ORDER BY orden`, [formId])).map(r => ({ item: n(r.item_general_id), cant: n(r.cantidad) }));
  const capa = n((await q(`SELECT item_general_id FROM inventario_capas WHERE id_capa=?`, [capaId]))[0]?.item_general_id);
  const mov = n((await q(`SELECT item_general_id FROM movimiento_inventario WHERE id_movimiento_inventario=?`, [movId]))[0]?.item_general_id);
  const costRemove = n((await q(`SELECT COUNT(*) c FROM costos_item WHERE item_general_id=?`, [remove]))[0].c);
  const nomRemove = (await q(`SELECT nombre FROM item_general WHERE id_item_general=?`, [remove]))[0].nombre;
  return { ip, igf, capa, mov, costRemove, nomRemove };
}

async function restore() {
  await q(`UPDATE item_proveedor SET item_general_id=? WHERE id_item_proveedor=?`, [remove, ipId]);
  await q(`DELETE FROM item_general_formulaciones WHERE formulaciones_id=?`, [formId]);
  await q(`INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad,orden,tipo) VALUES (?,?,5,1,'ingrediente'),(?,?,10,2,'ingrediente')`, [formId, keep, formId, remove]);
  await q(`UPDATE inventario_capas SET item_general_id=? WHERE id_capa=?`, [remove, capaId]);
  await q(`UPDATE movimiento_inventario SET item_general_id=? WHERE id_movimiento_inventario=?`, [remove, movId]);
  const has = n((await q(`SELECT COUNT(*) c FROM costos_item WHERE item_general_id=?`, [remove]))[0].c);
  if (!has) await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,2000,0,0,1,'Catál',1)`, [remove]);
  await q(`UPDATE costos_item SET costo_unitario=1000, metodo_calculo='Catál' WHERE item_general_id=?`, [keep]);
  await q(`UPDATE item_general SET nombre='ZZ REMOVE' WHERE id_item_general=?`, [remove]);
}

async function teardown() {
  await restore();
  await q(`DELETE FROM item_general_formulaciones WHERE formulaciones_id=?`, [formId]);
  await q(`DELETE FROM formulaciones WHERE id_formulaciones=?`, [formId]);
  await q(`DELETE FROM inventario_capas WHERE id_capa=?`, [capaId]);
  await q(`DELETE FROM movimiento_inventario WHERE id_movimiento_inventario=?`, [movId]);
  await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [ipId]);
  await q(`DELETE FROM costos_item WHERE item_general_id IN (?,?)`, [keep, remove]);
  await q(`DELETE FROM item_general WHERE id_item_general IN (?,?,?)`, [keep, remove, prod]);
}

async function doMerge(base) {
  const r = await fetch(`${base}/api/sincronizacion/merge`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ keep_id: keep, remove_id: remove }) });
  const body = await r.json().catch(() => null);
  const af = body?.detalle?.afectados;
  const afNorm = af && { proveedores: af.proveedores, formulaciones: af.formulaciones, capas: af.capas_historicas, movimientos: af.movimientos, costos_item_removed: af.costos_item_removed, prod: af.produccion_snapshot };
  return { status: r.status, af: afNorm, nombre_remove: body?.detalle?.nombre_remove, costo_keep: n(body?.detalle?.costo_keep) };
}

try {
  await setup();
  const rc = await doMerge(CI4); const sc = await capture(); await restore();
  const rn = await doMerge(NEST); const sn = await capture(); await restore();

  const ci4 = { resp: rc, state: sc }, nest = { resp: rn, state: sn };
  console.log('\n=== MERGE GOLDEN (keep=%d remove=%d) ===', keep, remove);
  console.log('-- CI4  --\n', JSON.stringify(ci4));
  console.log('-- Nest --\n', JSON.stringify(nest));
  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (merge idéntico)' : 'DIFF ✗') + ' ===');
  if (a !== b) { for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} != ${JSON.stringify(nest[k])}`); }
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
