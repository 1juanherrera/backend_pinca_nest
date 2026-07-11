// Golden harness de REQUISICIONES DE COMPRA (RequisicionesCompraController + Model).
// verificar-disponibilidad + MRP + CRUD + estado + convertir-a-OC. Errores {success:false}
// vs {ok,msg} de Nest → status only. Éxitos {success:true,...} full compare (ids normalizados).
//
// Uso: TOKEN_SECRET=... node test/requisiciones-golden.mjs

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
  if (path.endsWith('.fecha_creacion') || path.endsWith('.id_requisicion') || path.endsWith('.orden_compra_id')) return d;
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
function checkStatus(name, ci4, nest) { if (ci4.status === nest.status) { pass++; console.log(`  ✅ ${name} (status ${ci4.status})`); } else { fail++; console.log(`  ❌ ${name}: status ${ci4.status} (CI4) != ${nest.status} (Nest)`); } }
function expect(name, cond, got) { if (cond) { pass++; console.log(`  ✅ ${name}`); } else { fail++; console.log(`  ❌ ${name} → ${JSON.stringify(got)}`); } }

const ITEM = 1, UNIDAD = 3;
async function cleanupReqs() {
  await q(`DELETE d FROM ordenes_compra_detalle d JOIN ordenes_compra o ON o.id_orden=d.ordenes_compra_id WHERE o.numero LIKE 'ZZOC%' OR o.observaciones='ZZ_REQ_CONV'`);
  await q(`DELETE FROM ordenes_compra WHERE observaciones='ZZ_REQ_CONV'`);
  await q(`DELETE FROM requisiciones_compra WHERE observaciones LIKE 'ZZ_REQ%' OR observaciones LIKE 'Sugerida autom%'`);
  await q(`DELETE FROM notificaciones WHERE JSON_EXTRACT(metadata,'$.dedup_key') LIKE 'req-nueva-%' OR JSON_EXTRACT(metadata,'$.dedup_key') LIKE 'mrp-%'`);
}
async function getNumOC() { const r = (await q(`SELECT proximo_numero, anio_actual FROM numeracion_documentos WHERE tipo_doc='orden_compra'`))[0]; return { p: r.proximo_numero, a: r.anio_actual }; }
async function setNumOC(s) { await q(`UPDATE numeracion_documentos SET proximo_numero=?, anio_actual=? WHERE tipo_doc='orden_compra'`, [s.p, s.a]); }

try {
  const PROV = (await q(`SELECT id_proveedor FROM proveedor WHERE deleted_at IS NULL LIMIT 1`))[0].id_proveedor;
  const IP = (await q(`SELECT id_item_proveedor FROM item_proveedor WHERE deleted_at IS NULL LIMIT 1`))[0].id_item_proveedor;
  const BOD = (await q(`SELECT id_bodegas FROM bodegas LIMIT 1`))[0].id_bodegas;
  const PREP = (await q(`SELECT id_preparaciones FROM preparaciones LIMIT 1`))[0]?.id_preparaciones ?? 1;
  await cleanupReqs();
  console.log(`\nFixtures: item=${ITEM} unidad=${UNIDAD} prov=${PROV} ip=${IP} bod=${BOD} prep=${PREP}\n`);

  // ── VERIFICAR DISPONIBILIDAD ──
  console.log('── verificar-disponibilidad ──');
  check('GET verificar (item 1, 100 gal)',
    await api(CI4, 'GET', `/api/preparaciones/verificar-disponibilidad?item_general_id=${ITEM}&cantidad=100&unidad_id=${UNIDAD}`),
    await api(NEST, 'GET', `/api/preparaciones/verificar-disponibilidad?item_general_id=${ITEM}&cantidad=100&unidad_id=${UNIDAD}`));
  checkStatus('verificar sin params (422)',
    await api(CI4, 'GET', '/api/preparaciones/verificar-disponibilidad'),
    await api(NEST, 'GET', '/api/preparaciones/verificar-disponibilidad'));
  checkStatus('verificar unidad inexistente (422)',
    await api(CI4, 'GET', `/api/preparaciones/verificar-disponibilidad?item_general_id=${ITEM}&cantidad=10&unidad_id=99999`),
    await api(NEST, 'GET', `/api/preparaciones/verificar-disponibilidad?item_general_id=${ITEM}&cantidad=10&unidad_id=99999`));

  // ── SUGERIR MRP ──
  console.log('\n── sugerir-mrp ──');
  const mrpOp = async (base) => {
    const r = await api(base, 'POST', '/api/requisiciones/sugerir-mrp', { item_general_id: ITEM, cantidad: 100, unidad_id: UNIDAD });
    const creadas = (r.body?.data?.creadas ?? []).map(x => ({ ...x, id_requisicion: 0, fecha_creacion: 0 }));
    // cleanup lo creado
    await q(`DELETE FROM requisiciones_compra WHERE observaciones LIKE 'Sugerida autom%'`);
    await q(`DELETE FROM notificaciones WHERE JSON_EXTRACT(metadata,'$.dedup_key') LIKE 'mrp-%'`);
    return { status: r.status, sin_deficit: r.body?.data?.sin_deficit, nCreadas: creadas.length, nSinProv: (r.body?.data?.sin_proveedor ?? []).length, creadas, sin_proveedor: r.body?.data?.sin_proveedor };
  };
  check('POST sugerir-mrp (normalizado)', await mrpOp(CI4), await mrpOp(NEST));

  // ── INDEX (estado limpio) ──
  console.log('\n── index / listar ──');
  check('GET requisiciones (lista completa)',
    await api(CI4, 'GET', '/api/requisiciones'),
    await api(NEST, 'GET', '/api/requisiciones'));
  check('GET requisiciones?estado=APROBADA',
    await api(CI4, 'GET', '/api/requisiciones?estado=APROBADA'),
    await api(NEST, 'GET', '/api/requisiciones?estado=APROBADA'));

  // ── CREATE (batch) ──
  console.log('\n── POST /requisiciones ──');
  const createOp = async (base) => {
    const payload = [{ preparacion_id: PREP, item_general_id: ITEM, item_proveedor_id: IP, proveedor_id: PROV, cantidad: 5, cantidad_necesaria: 5, cantidad_disponible: 0, cantidad_solicitada: 5, precio_unitario: 10, observaciones: 'ZZ_REQ_CREATE' }];
    const r = await api(base, 'POST', '/api/requisiciones', payload);
    const data = (r.body?.data ?? []).map(x => ({ ...x, id_requisicion: 0, fecha_creacion: 0 }));
    await q(`DELETE FROM requisiciones_compra WHERE observaciones='ZZ_REQ_CREATE'`);
    await q(`DELETE FROM notificaciones WHERE JSON_EXTRACT(metadata,'$.dedup_key') LIKE 'req-nueva-%'`);
    return { status: r.status, success: r.body?.success, data };
  };
  check('POST create (normalizado)', await createOp(CI4), await createOp(NEST));
  checkStatus('POST create no-array (422)',
    await api(CI4, 'POST', '/api/requisiciones', { foo: 1 }),
    await api(NEST, 'POST', '/api/requisiciones', { foo: 1 }));
  checkStatus('POST create item inexistente (422)',
    await api(CI4, 'POST', '/api/requisiciones', [{ preparacion_id: PREP, item_general_id: 999999, cantidad: 1, cantidad_solicitada: 1 }]),
    await api(NEST, 'POST', '/api/requisiciones', [{ preparacion_id: PREP, item_general_id: 999999, cantidad: 1, cantidad_solicitada: 1 }]));

  // ── ESTADO ──
  console.log('\n── PATCH estado ──');
  const estadoOp = async (base, estado) => {
    const ins = await q(`INSERT INTO requisiciones_compra (preparacion_id,item_general_id,item_proveedor_id,proveedor_id,cantidad_necesaria,cantidad_disponible,cantidad_solicitada,precio_unitario,estado,observaciones,fecha_creacion) VALUES (?,?,?,?,5,0,5,10,'PENDIENTE','ZZ_REQ_EST',NOW())`, [PREP, ITEM, IP, PROV]);
    const id = ins.insertId;
    const r = await api(base, 'PATCH', `/api/requisiciones/${id}/estado`, { estado });
    const norm = r.body?.data ? { ...r.body.data, id_requisicion: 0, fecha_creacion: 0 } : null;
    await q(`DELETE FROM requisiciones_compra WHERE id_requisicion=?`, [id]);
    return { status: r.status, success: r.body?.success, data: norm };
  };
  check('PATCH estado APROBADA', await estadoOp(CI4, 'aprobada'), await estadoOp(NEST, 'aprobada'));
  checkStatus('PATCH estado inválido (422)', await estadoOp(CI4, 'PEPE'), await estadoOp(NEST, 'PEPE'));

  // ── CONVERTIR A OC ──
  console.log('\n── POST convertir-oc ──');
  const convOp = async (base) => {
    const numAntes = await getNumOC();
    const ins = await q(`INSERT INTO requisiciones_compra (preparacion_id,item_general_id,item_proveedor_id,proveedor_id,cantidad_necesaria,cantidad_disponible,cantidad_solicitada,precio_unitario,estado,observaciones,fecha_creacion) VALUES (?,?,?,?,8,0,8,25,'APROBADA','ZZ_REQ_CONV',NOW())`, [PREP, ITEM, IP, PROV]);
    const id = ins.insertId;
    const r = await api(base, 'POST', '/api/requisiciones/convertir-oc', { ids: [id], bodegas_id: BOD, observaciones: 'ZZ_REQ_CONV' });
    const ocId = r.body?.ordenes_compra_ids?.[0];
    const oc = ocId ? (await q(`SELECT estado, total FROM ordenes_compra WHERE id_orden=?`, [ocId]))[0] : null;
    const det = ocId ? (await q(`SELECT COUNT(*) n, COALESCE(SUM(subtotal),0) s FROM ordenes_compra_detalle WHERE ordenes_compra_id=?`, [ocId]))[0] : null;
    const req = (await q(`SELECT estado, orden_compra_id FROM requisiciones_compra WHERE id_requisicion=?`, [id]))[0];
    const cap = { status: r.status, success: r.body?.success, message: r.body?.message, nOc: r.body?.ordenes_compra_ids?.length, ocEstado: oc?.estado, ocTotal: oc ? Number(oc.total) : null, detN: det ? Number(det.n) : null, detSum: det ? Number(det.s) : null, reqEstado: req?.estado, reqConvertida: req?.orden_compra_id != null };
    // cleanup
    if (ocId) { await q(`DELETE FROM ordenes_compra_detalle WHERE ordenes_compra_id=?`, [ocId]); await q(`DELETE FROM ordenes_compra WHERE id_orden=?`, [ocId]); }
    await q(`DELETE FROM requisiciones_compra WHERE id_requisicion=?`, [id]);
    await setNumOC(numAntes);
    return cap;
  };
  check('POST convertir-oc (8 x 25 = 200)', await convOp(CI4), await convOp(NEST));
  checkStatus('convertir sin bodegas_id (422)',
    await api(CI4, 'POST', '/api/requisiciones/convertir-oc', { ids: [1] }),
    await api(NEST, 'POST', '/api/requisiciones/convertir-oc', { ids: [1] }));

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
} finally {
  await cleanupReqs().catch(() => {});
  await db.end();
}
process.exit(fail ? 1 : 0);
