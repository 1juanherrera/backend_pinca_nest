// Golden harness de ITEM_PROVEEDOR (ItemProveedorController + ProveedorController::get_item_proveedores).
// Reads full-compare. Mutaciones: mismo estado inicial, se resetea entre CI4/Nest.
// El auto-create (resolverItemGeneral) crea item_general(p_kg='')+costos_item → se verifica estructural.
//
// Uso: TOKEN_SECRET=... node test/itemprov-golden.mjs

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

async function api(base, method, path, body) {
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  const r = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
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
function expect(name, cond, got) { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name} → ${JSON.stringify(got)}`); } }
function checkStatus(name, ci4, nest) { if (ci4.status === nest.status) { pass++; console.log(`  ✅ ${name} (status ${ci4.status})`); } else { fail++; console.log(`  ❌ ${name}: status ${ci4.status} (CI4) != ${nest.status} (Nest)`); } }

const IPFIELDS = ['nombre', 'codigo', 'tipo', 'precio_unitario', 'precio_con_iva', 'disponible', 'descripcion', 'proveedor_id', 'item_general_id', 'unidad_compra_id', 'factor_conversion'];
const normIp = (r) => r ? Object.fromEntries(IPFIELDS.map(k => [k, r[k]])) : null;

async function cleanupMarkers() {
  const igs = await q(`SELECT id_item_general FROM item_general WHERE nombre LIKE 'ZZ_IP%' OR nombre LIKE 'ZZ_VINC%'`);
  for (const r of igs) { await q(`DELETE FROM costos_item WHERE item_general_id=?`, [r.id_item_general]); await q(`DELETE FROM item_general WHERE id_item_general=?`, [r.id_item_general]); }
  await q(`DELETE FROM item_proveedor WHERE nombre LIKE 'ZZ_IP%'`);
}

let PROV, IG;
try {
  PROV = (await q(`SELECT id_proveedor FROM proveedor WHERE deleted_at IS NULL LIMIT 1`))[0].id_proveedor;
  IG = (await q(`SELECT id_item_general FROM item_general WHERE deleted_at IS NULL LIMIT 1`))[0].id_item_general;
  await cleanupMarkers();
  console.log(`\nFixtures: proveedor=${PROV}, item_general=${IG}\n`);

  // ── LECTURAS ──
  console.log('── LECTURAS ──');
  check('GET item_proveedores (JOIN, 142 filas)',
    await api(CI4, 'GET', '/api/item_proveedores'),
    await api(NEST, 'GET', '/api/item_proveedores'));
  const anyIp = (await q(`SELECT id_item_proveedor FROM item_proveedor WHERE deleted_at IS NULL LIMIT 1`))[0].id_item_proveedor;
  check(`GET item_proveedores/${anyIp}`,
    await api(CI4, 'GET', `/api/item_proveedores/${anyIp}`),
    await api(NEST, 'GET', `/api/item_proveedores/${anyIp}`));
  // show() usa failNotFound (REST de CI4: {status,error,messages}) ≠ {ok,msg} de Nest → status only
  checkStatus('GET item_proveedores/999999 (404, shape REST tolerado)',
    await api(CI4, 'GET', '/api/item_proveedores/999999'),
    await api(NEST, 'GET', '/api/item_proveedores/999999'));
  check('GET proveedor_items (lista)',
    await api(CI4, 'GET', '/api/proveedor_items'),
    await api(NEST, 'GET', '/api/proveedor_items'));
  check(`GET proveedor_items/${PROV}`,
    await api(CI4, 'GET', `/api/proveedor_items/${PROV}`),
    await api(NEST, 'GET', `/api/proveedor_items/${PROV}`));

  // ── CREATE (vinculado a item_general existente) ──
  console.log('\n── CREATE (item_general_id provisto) ──');
  const createLinked = async (base) => {
    const r = await api(base, 'POST', '/api/item_proveedores', {
      nombre: 'ZZ_IP_LINK', codigo: 'ZZC1', tipo: 'Insumo', precio_unitario: 100, precio_con_iva: 119,
      disponible: 1, proveedor_id: PROV, item_general_id: IG, factor_conversion: 2,
    });
    const row = (await q(`SELECT * FROM item_proveedor WHERE nombre='ZZ_IP_LINK' AND deleted_at IS NULL ORDER BY id_item_proveedor DESC LIMIT 1`))[0];
    const cap = { status: r.status, mensaje: r.body?.mensaje, item_general_id: r.body?.item_general_id, row: normIp(row) };
    await q(`DELETE FROM item_proveedor WHERE nombre='ZZ_IP_LINK'`);
    return cap;
  };
  check('POST create (link)', await createLinked(CI4), await createLinked(NEST));

  console.log('\n── CREATE empty (422) ──');
  check('POST {} (422)',
    await api(CI4, 'POST', '/api/item_proveedores', {}),
    await api(NEST, 'POST', '/api/item_proveedores', {}));

  // ── CREATE auto (resolverItemGeneral crea item_general+costos_item) ──
  console.log('\n── CREATE auto-by-name (item_general nuevo, p_kg) ──');
  const autoCreate = async (base, nombre) => {
    const r = await api(base, 'POST', '/api/item_proveedores', { nombre, proveedor_id: PROV, precio_unitario: 50, tipo: 'Materia Prima' });
    const igid = r.body?.item_general_id;
    const ig = igid ? (await q(`SELECT nombre, tipo, p_kg FROM item_general WHERE id_item_general=?`, [igid]))[0] : null;
    const cos = igid ? (await q(`SELECT COUNT(*) n FROM costos_item WHERE item_general_id=?`, [igid]))[0].n : 0;
    return { status: r.status, mensaje: r.body?.mensaje, igNombre: ig?.nombre, igTipo: ig != null ? Number(ig.tipo) : null, pKg: ig?.p_kg, costosItem: Number(cos) };
  };
  const ci4Auto = await autoCreate(CI4, 'ZZ_IP_AUTO_CI4');
  const nestAuto = await autoCreate(NEST, 'ZZ_IP_AUTO_NEST');
  expect('CI4 auto-create OK (201, item_general MP p_kg="")', ci4Auto.status === 201 && ci4Auto.igTipo === 1 && ci4Auto.pKg === '' && ci4Auto.costosItem === 1, ci4Auto);
  expect('Nest auto-create OK (201, item_general MP p_kg="")', nestAuto.status === 201 && nestAuto.igTipo === 1 && nestAuto.pKg === '' && nestAuto.costosItem === 1, nestAuto);
  expect('Nest nombre uppercased == CI4 pattern', nestAuto.igNombre === 'ZZ_IP_AUTO_NEST' && ci4Auto.igNombre === 'ZZ_IP_AUTO_CI4', { ci4: ci4Auto.igNombre, nest: nestAuto.igNombre });
  await cleanupMarkers();

  // ── UPDATE ──
  console.log('\n── UPDATE ──');
  const updateOp = async (base) => {
    const ins = await q(`INSERT INTO item_proveedor (nombre, proveedor_id, item_general_id, precio_unitario, factor_conversion) VALUES ('ZZ_IP_UPD', ?, ?, 10, 1)`, [PROV, IG]);
    const id = ins.insertId;
    const r = await api(base, 'PUT', `/api/item_proveedores/${id}`, { precio_unitario: 555, item_general_id: IG, factor_conversion: 4 });
    const row = (await q(`SELECT precio_unitario, factor_conversion, item_general_id FROM item_proveedor WHERE id_item_proveedor=?`, [id]))[0];
    const cap = { status: r.status, mensaje: r.body?.mensaje?.replace(String(id), '{id}'), item_general_id: r.body?.item_general_id, dbPrecio: Number(row.precio_unitario), dbFactor: Number(row.factor_conversion) };
    await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [id]);
    return cap;
  };
  check('PUT update', await updateOp(CI4), await updateOp(NEST));
  check('PUT update 999999 (404)',
    await api(CI4, 'PUT', '/api/item_proveedores/999999', { precio_unitario: 1 }),
    await api(NEST, 'PUT', '/api/item_proveedores/999999', { precio_unitario: 1 }));

  // ── DELETE (soft) ──
  console.log('\n── DELETE (soft) ──');
  const deleteOp = async (base) => {
    const ins = await q(`INSERT INTO item_proveedor (nombre, proveedor_id, factor_conversion) VALUES ('ZZ_IP_DEL', ?, 1)`, [PROV]);
    const id = ins.insertId;
    const r = await api(base, 'DELETE', `/api/item_proveedores/${id}`);
    const row = (await q(`SELECT deleted_at FROM item_proveedor WHERE id_item_proveedor=?`, [id]))[0];
    const cap = { status: r.status, mensaje: r.body?.mensaje?.replace(String(id), '{id}'), softDeleted: row.deleted_at != null };
    await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [id]);
    return cap;
  };
  check('DELETE soft', await deleteOp(CI4), await deleteOp(NEST));

  // ── VINCULAR ──
  console.log('\n── VINCULAR ──');
  const vincOp = async (base, payload) => {
    const ins = await q(`INSERT INTO item_proveedor (nombre, proveedor_id, factor_conversion) VALUES ('ZZ_IP_VINC', ?, 1)`, [PROV]);
    const id = ins.insertId;
    const r = await api(base, 'PATCH', `/api/item_proveedores/${id}/vincular`, payload);
    const row = (await q(`SELECT item_general_id, unidad_compra_id, factor_conversion FROM item_proveedor WHERE id_item_proveedor=?`, [id]))[0];
    const cap = { status: r.status, body: r.body, dbIgId: row?.item_general_id, dbFactor: row ? Number(row.factor_conversion) : null };
    await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [id]);
    return cap;
  };
  check('PATCH vincular a existente', await vincOp(CI4, { item_general_id: IG, factor_conversion: 3 }), await vincOp(NEST, { item_general_id: IG, factor_conversion: 3 }));
  check('PATCH desvincular (item_general_id null)', await vincOp(CI4, { item_general_id: null }), await vincOp(NEST, { item_general_id: null }));
  // factor 0: CI4 validateJson → 422; Nest replica el 422 (shape {ok,msg} tolerado) → status only
  checkStatus('PATCH vincular factor 0 (422 validación)', await vincOp(CI4, { factor_conversion: 0 }), await vincOp(NEST, { factor_conversion: 0 }));

  // vincular crear:true — CI4 MUERTO (in_list rechaza el booleano → 422). Nest lo implementa correctamente.
  console.log('  (crear:true está MUERTO en CI4: in_list rechaza el booleano → 422; Nest-correcto crea)');
  const vincCrear = async (base, nombre) => {
    const ins = await q(`INSERT INTO item_proveedor (nombre, proveedor_id, factor_conversion) VALUES ('ZZ_IP_VINCC', ?, 1)`, [PROV]);
    const id = ins.insertId;
    const r = await api(base, 'PATCH', `/api/item_proveedores/${id}/vincular`, { crear: true, nombre, tipo: 2 });
    const igid = r.body?.item_general_id;
    const ig = igid ? (await q(`SELECT nombre, tipo, p_kg FROM item_general WHERE id_item_general=?`, [igid]))[0] : null;
    await q(`DELETE FROM item_proveedor WHERE id_item_proveedor=?`, [id]);
    return { status: r.status, mensaje: r.body?.mensaje, igExists: !!ig, igTipo: ig ? Number(ig.tipo) : null, pKg: ig?.p_kg };
  };
  const c1 = await vincCrear(CI4, 'ZZ_VINC_NEW_CI4');
  const c2 = await vincCrear(NEST, 'ZZ_VINC_NEW_NEST');
  expect('CI4 crear:true MUERTO (422, doc)', c1.status === 422, c1);
  expect('Nest crear:true → item_general nuevo (200, tipo=2, p_kg="")', c2.status === 200 && c2.igExists && c2.igTipo === 2 && c2.pKg === '', c2);
  await cleanupMarkers();

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanupMarkers().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
