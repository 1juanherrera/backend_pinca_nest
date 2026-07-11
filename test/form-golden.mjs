// Golden de FORMULACIONES: verifica que crear una receta en Nest escribe el BOM
// (item_general_formulaciones) + cabecera + versión IGUAL que CI4.
// Receta: MP1 10kg (nota), instrucción "Mezclar", MP2 5kg.
// Uso: TOKEN_SECRET=... node test/form-golden.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['formulaciones'], token_version: 1 } });

const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));

let prodId, mp1, mp2;

async function setup() {
  const ins = async (nom, cod, tipo) => (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,?,'',0)`, [nom, cod, tipo])).insertId;
  prodId = await ins('ZZ FPROD', 'ZZFP', 0);
  mp1 = await ins('ZZ FMP1', 'ZZFM1', 1);
  mp2 = await ins('ZZ FMP2', 'ZZFM2', 1);
  for (const it of [prodId, mp1, mp2]) await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,1000,0,0,1,'Catál',1)`, [it]);
}

const body = () => ({ item_general_id: prodId, nombre: 'ZZ FORM', descripcion: 'desc test', volumen: 1, materias_primas: [
  { materia_prima_id: mp1, cantidad: 10, nota: 'nota uno' },
  { tipo: 'instruccion', texto: 'Mezclar bien' },
  { materia_prima_id: mp2, cantidad: 5 },
] });

async function crear(base) {
  const r = await fetch(`${base}/api/formulaciones`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body()) });
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function capture() {
  const form = (await q(`SELECT id_formulaciones,nombre,descripcion,estado,version_actual,item_general_id FROM formulaciones WHERE item_general_id=? AND estado=1`, [prodId]))[0];
  const fid = form?.id_formulaciones;
  const igf = fid ? (await q(`SELECT item_general_id,cantidad,porcentaje,orden,tipo,texto,nota FROM item_general_formulaciones WHERE formulaciones_id=? ORDER BY orden`, [fid])) : [];
  const ver = fid ? (await q(`SELECT version_num,created_by, JSON_LENGTH(ingredientes) AS n_ingredientes FROM formulaciones_versiones WHERE formulacion_id=? ORDER BY version_num DESC LIMIT 1`, [fid]))[0] : null;
  return {
    form: form && { nombre: form.nombre, descripcion: form.descripcion, estado: n(form.estado), version_actual: n(form.version_actual), item: n(form.item_general_id) },
    igf: igf.map(r => ({ item: n(r.item_general_id), cantidad: n(r.cantidad), pct: n(r.porcentaje), orden: n(r.orden), tipo: r.tipo, texto: r.texto, nota: r.nota })),
    ver: ver && { version_num: n(ver.version_num), created_by: ver.created_by, n_ing: n(ver.n_ingredientes) },
  };
}

async function restore() {
  const forms = await q(`SELECT id_formulaciones FROM formulaciones WHERE item_general_id=?`, [prodId]);
  for (const f of forms) {
    await q(`DELETE FROM formulaciones_versiones WHERE formulacion_id=?`, [f.id_formulaciones]);
    await q(`DELETE FROM item_general_formulaciones WHERE formulaciones_id=?`, [f.id_formulaciones]);
  }
  await q(`DELETE FROM formulaciones WHERE item_general_id=?`, [prodId]);
}

async function teardown() {
  await restore();
  await q(`DELETE FROM costos_item WHERE item_general_id IN (?,?,?)`, [prodId, mp1, mp2]);
  await q(`DELETE FROM item_general WHERE id_item_general IN (?,?,?)`, [prodId, mp1, mp2]);
}

try {
  await setup();
  const rc = await crear(CI4); const ci4 = await capture(); await restore();
  const rn = await crear(NEST); const nest = await capture(); await restore();

  console.log('\n=== FORM GOLDEN: crear receta — Nest vs CI4 ===\n');
  console.log('CI4  respondió:', rc.status, JSON.stringify(rc.body));
  console.log('Nest respondió:', rn.status, JSON.stringify(rn.body));
  console.log('\n-- CI4  --\n', JSON.stringify(ci4));
  console.log('\n-- Nest --\n', JSON.stringify(nest));

  const a = JSON.stringify(ci4), b = JSON.stringify(nest);
  console.log('\n=== VERDICTO: ' + (a === b ? 'MATCH ✓ (BOM/receta idéntica)' : 'DIFF ✗') + ' ===');
  if (a !== b) for (const k of Object.keys(ci4)) if (JSON.stringify(ci4[k]) !== JSON.stringify(nest[k])) console.log(`  ${k}: ${JSON.stringify(ci4[k])} (CI4) != ${JSON.stringify(nest[k])} (Nest)`);
} finally {
  await teardown();
  await db.end();
  console.log('\n(fixture eliminado)');
}
