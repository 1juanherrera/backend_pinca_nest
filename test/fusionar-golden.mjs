// Golden de FUSIONAR CLUSTER (dedup IA, sin LLM): crea un cluster con keep + 2
// items merge, fusiona (loop de merge N→1), y compara estado del cluster, auditoría
// y reasignación de FKs entre CI4 y Nest.
// Uso: TOKEN_SECRET=... node test/fusionar-golden.mjs

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

let keep, r1, r2, cl, ip1, ip2;

async function setup() {
  const ins = async (nom, cod) => (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,1,'',0)`, [nom, cod])).insertId;
  keep = await ins('ZZ KEEP', 'ZZCK'); r1 = await ins('ZZ R1', 'ZZC1'); r2 = await ins('ZZ R2', 'ZZC2');
  for (const [it, c] of [[keep, 1000], [r1, 2000], [r2, 3000]]) await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,?,0,0,1,'Catál',1)`, [it, c]);
  ip1 = (await q(`INSERT INTO item_proveedor (proveedor_id,item_general_id,nombre,factor_conversion,precio_unitario,disponible,tipo) VALUES (23,?,'IP1',1,2000,1,1)`, [r1])).insertId;
  ip2 = (await q(`INSERT INTO item_proveedor (proveedor_id,item_general_id,nombre,factor_conversion,precio_unitario,disponible,tipo) VALUES (23,?,'IP2',1,3000,1,1)`, [r2])).insertId;
  // capas AGOTADAS en los removes (sin stock activo)
  await q(`INSERT INTO inventario_capas (item_general_id,bodegas_id,proveedor_id,cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,fecha_ingreso,estado) VALUES (?,1,23,10,0,2000,1,NOW(),0)`, [r1]);
  cl = (await q(`INSERT INTO item_sync_clusters (nombre_base_propuesto,nombre_base_aprobado,confianza,tipo,estado,keep_id_sugerido,keep_id_aprobado,created_at) VALUES ('ZZ BASE','ZZ BASE','alta',1,'aprobado',?,?,NOW())`, [keep, keep])).insertId;
  await q(`INSERT INTO item_sync_cluster_items (cluster_id,item_general_id,rol,confianza_item) VALUES (?,?,'keep','alta'),(?,?,'merge','alta'),(?,?,'merge','alta')`, [cl, keep, cl, r1, cl, r2]);
}

async function capture() {
  const c = (await q(`SELECT estado,keep_id_aprobado,nombre_base_aprobado FROM item_sync_clusters WHERE id_cluster=?`, [cl]))[0];
  const ip1i = n((await q(`SELECT item_general_id FROM item_proveedor WHERE id_item_proveedor=?`, [ip1]))[0]?.item_general_id);
  const ip2i = n((await q(`SELECT item_general_id FROM item_proveedor WHERE id_item_proveedor=?`, [ip2]))[0]?.item_general_id);
  const aud = (await q(`SELECT keep_id,remove_id,revertido FROM item_sync_auditoria WHERE cluster_id=? ORDER BY remove_id`, [cl])).map(a => ({ keep: n(a.keep_id), rem: n(a.remove_id), rev: n(a.revertido) }));
  const keepNom = (await q(`SELECT nombre FROM item_general WHERE id_item_general=?`, [keep]))[0].nombre;
  const r1Nom = (await q(`SELECT nombre FROM item_general WHERE id_item_general=?`, [r1]))[0].nombre;
  const costRem = n((await q(`SELECT COUNT(*) c FROM costos_item WHERE item_general_id IN (?,?)`, [r1, r2]))[0].c);
  return { cluster: { estado: c.estado, keep: n(c.keep_id_aprobado), base: c.nombre_base_aprobado }, ip1: ip1i, ip2: ip2i, aud, keepNom, r1Nom, costRem };
}

async function restore() {
  await q(`UPDATE item_proveedor SET item_general_id=? WHERE id_item_proveedor=?`, [r1, ip1]);
  await q(`UPDATE item_proveedor SET item_general_id=? WHERE id_item_proveedor=?`, [r2, ip2]);
  await q(`UPDATE inventario_capas SET item_general_id=? WHERE proveedor_id=23 AND item_general_id=? AND estado=0`, [r1, keep]); // por si movió la capa agotada
  await q(`UPDATE item_general SET nombre='ZZ KEEP' WHERE id_item_general=?`, [keep]);
  await q(`UPDATE item_general SET nombre='ZZ R1' WHERE id_item_general=?`, [r1]);
  await q(`UPDATE item_general SET nombre='ZZ R2' WHERE id_item_general=?`, [r2]);
  for (const [it, c] of [[r1, 2000], [r2, 3000]]) { const has = n((await q(`SELECT COUNT(*) c FROM costos_item WHERE item_general_id=?`, [it]))[0].c); if (!has) await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,?,0,0,1,'Catál',1)`, [it, c]); }
  await q(`UPDATE costos_item SET costo_unitario=1000, metodo_calculo='Catál' WHERE item_general_id=?`, [keep]);
  await q(`DELETE FROM item_sync_auditoria WHERE cluster_id=?`, [cl]);
  await q(`UPDATE item_sync_clusters SET estado='aprobado', fusionado_at=NULL, keep_id_aprobado=? WHERE id_cluster=?`, [keep, cl]);
}

async function teardown() {
  await restore();
  await q(`DELETE FROM item_sync_cluster_items WHERE cluster_id=?`, [cl]);
  await q(`DELETE FROM item_sync_clusters WHERE id_cluster=?`, [cl]);
  await q(`DELETE FROM item_proveedor WHERE id_item_proveedor IN (?,?)`, [ip1, ip2]);
  await q(`DELETE FROM inventario_capas WHERE item_general_id IN (?,?,?)`, [keep, r1, r2]);
  await q(`DELETE FROM costos_item WHERE item_general_id IN (?,?,?)`, [keep, r1, r2]);
  await q(`DELETE FROM item_general WHERE id_item_general IN (?,?,?)`, [keep, r1, r2]);
}

async function fusionar(base) {
  const r = await fetch(`${base}/api/sincronizacion/ia/clusters/${cl}/fusionar`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: '{}' });
  const body = await r.json().catch(() => null);
  const d = body?.detalle;
  return { status: r.status, resp: d && { keep: n(d.keep_id), fusionados: n(d.fusionados), remove_ids: (d.remove_ids || []).map(Number).sort(), verif_formulas: n(d.verificacion?.formulas_afectadas) } };
}

try {
  await setup();
  const rc = await fusionar(CI4); const sc = await capture(); await restore();
  const rn = await fusionar(NEST); const sn = await capture(); await restore();
  const ci4 = { r: rc, s: sc }, nest = { r: rn, s: sn };
  console.log('\n=== FUSIONAR GOLDEN (cluster keep+2 merges) ===');
  console.log('-- CI4  --\n', JSON.stringify(ci4));
  console.log('-- Nest --\n', JSON.stringify(nest));
  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (fusión de cluster idéntica)' : 'DIFF ✗') + ' ===');
  if (a !== b) for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} != ${JSON.stringify(nest[k])}`);
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
