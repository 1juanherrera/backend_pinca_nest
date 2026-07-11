// Smoke/golden de sub-endpoints: (A) costos indirectos de preparación (add),
// (B) detalle de versión de formulación (con diff). Compara Nest vs CI4.
// Uso: TOKEN_SECRET=... node test/subendpoints-smoke.mjs

import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const CI4 = 'http://127.0.0.1:8080';
const NEST = 'http://127.0.0.1:3009';
const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) { console.error('Falta TOKEN_SECRET'); process.exit(1); }
const b64 = (b) => Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwt = (p) => { const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })); const bd = b64(JSON.stringify(p)); return `${h}.${bd}.${b64(crypto.createHmac('sha256', SECRET).update(`${h}.${bd}`).digest())}`; };
const now = Math.floor(Date.now() / 1000);
const TOKEN = jwt({ iat: now, exp: now + 3600, data: { id: 2, username: 'goldentest', nombre: 'gt', rol: 'admin', modulos: ['produccion', 'formulaciones'], token_version: 1 } });
const db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'user', password: 'password', database: 'gestorpincadb' });
const q = async (sql, p = []) => (await db.query(sql, p))[0];
const n = (x) => (x == null ? null : Number(x));
const api = async (base, path, method = 'GET', body = null) => { const r = await fetch(base + path, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };

// ── PART A: costos indirectos ──
async function testCostos() {
  const u = (await q(`SELECT id_unidad FROM unidad WHERE estados=1 LIMIT 1`))[0].id_unidad;
  const it = (await q(`SELECT id_item_general FROM item_general WHERE deleted_at IS NULL LIMIT 1`))[0].id_item_general;
  const prep = (await q(`INSERT INTO preparaciones (fecha_creacion,cantidad,estado,item_general_id,unidad_id) VALUES (NOW(),1,0,?,?)`, [it, u])).insertId;

  const run = async (base) => {
    const r = await api(base, `/api/preparaciones/${prep}/costos`, 'POST', { nombre: 'Energía', categoria: 'servicios', valor_aplicado: 1500 });
    const row = (await q(`SELECT nombre,categoria,valor_aplicado FROM preparaciones_costos_indirectos WHERE preparaciones_id=? ORDER BY id DESC LIMIT 1`, [prep]))[0];
    await q(`DELETE FROM preparaciones_costos_indirectos WHERE preparaciones_id=?`, [prep]);
    return { status: r.status, data: r.body?.data && { id_present: r.body.data.id != null, nombre: r.body.data.nombre, categoria: r.body.data.categoria, valor: n(r.body.data.valor_aplicado) }, row: row && { nombre: row.nombre, categoria: row.categoria, valor: n(row.valor_aplicado) } };
  };
  const ci4 = await run(CI4), nest = await run(NEST);
  await q(`DELETE FROM preparaciones WHERE id_preparaciones=?`, [prep]);
  const ok = JSON.stringify(ci4) === JSON.stringify(nest);
  console.log(`\n[A] addCosto: CI4 ${ci4.status} / Nest ${nest.status} → ${ok ? 'MATCH ✓' : 'DIFF ✗'}`);
  console.log('  CI4 :', JSON.stringify(ci4)); console.log('  Nest:', JSON.stringify(nest));
  return ok;
}

// ── PART B: detalle de versión (con diff) ──
async function testVersionDetalle() {
  const ins = async (nom, cod, tipo) => (await q(`INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,?,'',0)`, [nom, cod, tipo])).insertId;
  const prod = await ins('ZZ VPROD', 'ZZVP', 0), m1 = await ins('ZZ VMP1', 'ZZV1', 1), m2 = await ins('ZZ VMP2', 'ZZV2', 1);
  for (const x of [prod, m1, m2]) await q(`INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,metodo_calculo,estado) VALUES (?,1000,0,0,1,'Catál',1)`, [x]);

  // v1 (m1:10) y v2 (m1:20, +m2:5) — creando la fórmula 2 veces (crearFormulacion desactiva la previa; usamos update para versionar)
  const cre = await api(NEST, `/api/formulaciones`, 'POST', { item_general_id: prod, nombre: 'ZZ VF', materias_primas: [{ materia_prima_id: m1, cantidad: 10 }] });
  const fid = cre.body?.id;
  await api(NEST, `/api/formulaciones/${fid}`, 'PUT', { item_general_id: prod, nombre: 'ZZ VF', materias_primas: [{ materia_prima_id: m1, cantidad: 20 }, { materia_prima_id: m2, cantidad: 5 }] });
  // versión 2 id
  const vers = await q(`SELECT id,version_num FROM formulaciones_versiones WHERE formulacion_id=? ORDER BY version_num`, [fid]);
  const v2 = vers.find(v => Number(v.version_num) === 2)?.id;

  const norm = (d) => d && {
    version_num: n(d.version_num),
    n_ing: Array.isArray(d.ingredientes) ? d.ingredientes.length : null,
    va: d.version_anterior && { version_num: n(d.version_anterior.version_num) },
    agregados: (d.diff?.agregados || []).map(x => n(x.item_general_id)).sort(),
    modificados: (d.diff?.modificados || []).map(x => ({ item: n(x.item_general_id), antes: n(x.cantidad_antes), desp: n(x.cantidad_despues) })),
    removidos: (d.diff?.removidos || []).map(x => n(x.item_general_id)).sort(),
  };
  const rc = await api(CI4, `/api/formulaciones/versiones/${v2}`);
  const rn = await api(NEST, `/api/formulaciones/versiones/${v2}`);
  const ci4 = norm(rc.body), nest = norm(rn.body);

  // teardown
  for (const f of await q(`SELECT id_formulaciones FROM formulaciones WHERE item_general_id=?`, [prod])) {
    await q(`DELETE FROM formulaciones_versiones WHERE formulacion_id=?`, [f.id_formulaciones]);
    await q(`DELETE FROM item_general_formulaciones WHERE formulaciones_id=?`, [f.id_formulaciones]);
  }
  await q(`DELETE FROM formulaciones WHERE item_general_id=?`, [prod]);
  await q(`DELETE FROM costos_item WHERE item_general_id IN (?,?,?)`, [prod, m1, m2]);
  await q(`DELETE FROM item_general WHERE id_item_general IN (?,?,?)`, [prod, m1, m2]);

  const ok = JSON.stringify(ci4) === JSON.stringify(nest);
  console.log(`\n[B] versionDetalle (diff): CI4 ${rc.status} / Nest ${rn.status} → ${ok ? 'MATCH ✓' : 'DIFF ✗'}`);
  console.log('  CI4 :', JSON.stringify(ci4)); console.log('  Nest:', JSON.stringify(nest));
  return ok;
}

try {
  console.log('=== SUB-ENDPOINTS SMOKE (Nest vs CI4) ===');
  const a = await testCostos();
  const b = await testVersionDetalle();
  console.log(`\n=== RESUMEN: ${(a && b) ? 'TODO MATCH ✓' : 'HAY DIFERENCIAS ✗'} ===`);
} finally { await db.end(); console.log('(fixtures eliminados)'); }
