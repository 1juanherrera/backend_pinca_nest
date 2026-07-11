import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
if(!S){console.error('Falta TOKEN_SECRET');process.exit(1);}
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const nn=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:nn,exp:nn+3600,data:{id:2,username:'gt',nombre:'gt',rol:'admin',modulos:['compras'],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'user',password:'password',database:'gestorpincadb'});
const q=async(s,p=[])=>(await db.query(s,p))[0];
const N=x=>x==null?null:Number(x);
let it1,it2,ip1,ip2,ocId,det1,det2;
async function setup(){
  const ins=async(n,codigo)=>(await q("INSERT INTO item_general (nombre,codigo,tipo,p_kg,costo_produccion) VALUES (?,?,1,'',0)",[n,codigo])).insertId;
  it1=await ins('ZZ PRO A','ZZPA'); it2=await ins('ZZ PRO B','ZZPB');
  for(const it of [it1,it2]) await q("INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,metodo_calculo,volumen,estado) VALUES (?,0,0,0,'Catál',1,1)",[it]);
  ip1=(await q("INSERT INTO item_proveedor (proveedor_id,item_general_id,nombre,factor_conversion,unidad_compra_id,precio_unitario,disponible,tipo) VALUES (23,?,'ZZ IPA',25,1,50000,1,1)",[it1])).insertId;
  ip2=(await q("INSERT INTO item_proveedor (proveedor_id,item_general_id,nombre,factor_conversion,unidad_compra_id,precio_unitario,disponible,tipo) VALUES (23,?,'ZZ IPB',10,1,30000,1,1)",[it2])).insertId;
  ocId=(await q("INSERT INTO ordenes_compra (numero,proveedor_id,bodegas_id,fecha,estado,total,iva_pct) VALUES ('ZZ-PRO-OC',23,1,CURDATE(),'Enviada',190000,19)")).insertId;
  det1=(await q("INSERT INTO ordenes_compra_detalle (ordenes_compra_id,item_proveedor_id,item_general_id,cantidad,precio_unit,subtotal,cantidad_recibida) VALUES (?,?,?,2,50000,100000,0)",[ocId,ip1,it1])).insertId;
  det2=(await q("INSERT INTO ordenes_compra_detalle (ordenes_compra_id,item_proveedor_id,item_general_id,cantidad,precio_unit,subtotal,cantidad_recibida) VALUES (?,?,?,3,30000,90000,0)",[ocId,ip2,it2])).insertId;
}
async function capItem(it){
  const capa=(await q("SELECT cantidad_original,cantidad_disponible,costo_unitario,factor_conversion,precio_compra,lote_proveedor,estado FROM inventario_capas WHERE orden_compra_id=? AND item_general_id=? ORDER BY id_capa DESC LIMIT 1",[ocId,it]))[0]||null;
  const mov=(await q("SELECT cantidad,costo_unitario,saldo_anterior,saldo_nuevo FROM movimiento_inventario WHERE referencia_tipo='ORDEN_COMPRA' AND referencia_id=? AND item_general_id=? ORDER BY id_movimiento_inventario DESC LIMIT 1",[ocId,it]))[0]||null;
  const cp=(await q("SELECT costo_produccion FROM item_general WHERE id_item_general=?",[it]))[0];
  return {capa:capa&&{co:N(capa.cantidad_original),cd:N(capa.cantidad_disponible),cu:N(capa.costo_unitario),fc:N(capa.factor_conversion),pc:N(capa.precio_compra),estado:N(capa.estado)},mov:mov&&{c:N(mov.cantidad),cu:N(mov.costo_unitario),sa:N(mov.saldo_anterior),sn:N(mov.saldo_nuevo)},costo_produccion:N(cp.costo_produccion)};
}
async function capture(){ const oc=(await q("SELECT estado FROM ordenes_compra WHERE id_orden=?",[ocId]))[0].estado;
  const d1=(await q("SELECT cantidad_recibida,(recibido_en IS NOT NULL) rec FROM ordenes_compra_detalle WHERE id_detalle=?",[det1]))[0];
  const d2=(await q("SELECT cantidad_recibida,(recibido_en IS NOT NULL) rec FROM ordenes_compra_detalle WHERE id_detalle=?",[det2]))[0];
  return {oc_estado:oc, det1:{c:N(d1.cantidad_recibida),rec:N(d1.rec)}, det2:{c:N(d2.cantidad_recibida),rec:N(d2.rec)}, item1:await capItem(it1), item2:await capItem(it2)};
}
async function restore(){
  await q("DELETE FROM inventario_capas WHERE orden_compra_id=?",[ocId]);
  await q("DELETE FROM movimiento_inventario WHERE referencia_tipo='ORDEN_COMPRA' AND referencia_id=?",[ocId]);
  await q("UPDATE ordenes_compra_detalle SET cantidad_recibida=0,recibido_en=NULL WHERE id_detalle IN (?,?)",[det1,det2]);
  await q("UPDATE ordenes_compra SET estado='Enviada' WHERE id_orden=?",[ocId]);
  for(const it of [it1,it2]){ await q("UPDATE costos_item SET costo_unitario=0,metodo_calculo='Catál' WHERE item_general_id=?",[it]); await q("DELETE FROM inventario WHERE item_general_id=?",[it]); await q("UPDATE item_general SET costo_produccion=0 WHERE id_item_general=?",[it]); }
}
async function teardown(){ await restore(); await q("DELETE FROM ordenes_compra_detalle WHERE ordenes_compra_id=?",[ocId]); await q("DELETE FROM ordenes_compra WHERE id_orden=?",[ocId]); await q("DELETE FROM item_proveedor WHERE id_item_proveedor IN (?,?)",[ip1,ip2]); for(const it of [it1,it2]){await q("DELETE FROM costos_item WHERE item_general_id=?",[it]);await q("DELETE FROM item_general WHERE id_item_general=?",[it]);} }
const prorr=async(base)=>{const r=await fetch(`${base}/api/ordenes_compra/${ocId}/recibir-prorrateado`,{method:'POST',headers:{Authorization:'Bearer '+T,'Content-Type':'application/json'},body:JSON.stringify({precio_total_pagado:200000,lineas:[{id_detalle:det1,cantidad_recibida:2},{id_detalle:det2,cantidad_recibida:3}]})});return {status:r.status,body:await r.json().catch(()=>null)};};
function diff(a,bb,p=''){const d=[];if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){d.push(...diff(a[k],bb[k],p+'.'+k));}return d;}if(String(a)!==String(bb)&&Number(a)!==Number(bb))d.push(`${p}: ${a} != ${bb}`);return d;}
let pass=0,fail=0;
try{
  await setup();
  const rCI4=await prorr(CI4); const sCI4=await capture(); await restore();
  const rNest=await prorr(NEST); const sNest=await capture(); await restore();
  console.log(`\nHTTP: CI4 ${rCI4.status} / Nest ${rNest.status}`);
  const respDiff=diff({ok:rCI4.body?.ok,mensaje:rCI4.body?.mensaje,factor:rCI4.body?.factor,lineas:rCI4.body?.lineas},{ok:rNest.body?.ok,mensaje:rNest.body?.mensaje,factor:rNest.body?.factor,lineas:rNest.body?.lineas});
  if(rCI4.status===rNest.status&&!respDiff.length){pass++;console.log('  ✅ respuesta (ok/mensaje/factor/lineas)');}else{fail++;console.log('  ❌ respuesta',rCI4.body,rNest.body);respDiff.forEach(x=>console.log('     '+x));}
  const stDiff=diff(sCI4,sNest);
  if(!stDiff.length){pass++;console.log('  ✅ estado BD idéntico (capas/costos/movimientos/OC, 2 items)');}else{fail++;console.log('  ❌ estado BD');stDiff.slice(0,12).forEach(x=>console.log('     '+x));}
  // sanity no-trivial
  console.log(`  (factor=${rCI4.body?.factor}, capa it1 costo=${sCI4.item1.capa?.cu}, OC=${sCI4.oc_estado})`);
  // errores
  const e1=await prorr; // placeholder
  const val=async(base,body)=>{const r=await fetch(`${base}/api/ordenes_compra/${ocId}/recibir-prorrateado`,{method:'POST',headers:{Authorization:'Bearer '+T,'Content-Type':'application/json'},body:JSON.stringify(body)});return r.status;};
  const c422a=await val(CI4,{precio_total_pagado:0,lineas:[{id_detalle:det1,cantidad_recibida:1},{id_detalle:det2,cantidad_recibida:1}]}), n422a=await val(NEST,{precio_total_pagado:0,lineas:[{id_detalle:det1,cantidad_recibida:1},{id_detalle:det2,cantidad_recibida:1}]});
  if(c422a===n422a){pass++;console.log(`  ✅ precio 0 (${c422a})`);}else{fail++;console.log(`  ❌ precio 0 ${c422a}/${n422a}`);}
  const c422b=await val(CI4,{precio_total_pagado:100,lineas:[{id_detalle:det1,cantidad_recibida:1}]}), n422b=await val(NEST,{precio_total_pagado:100,lineas:[{id_detalle:det1,cantidad_recibida:1}]});
  if(c422b===n422b){pass++;console.log(`  ✅ <2 líneas (${c422b})`);}else{fail++;console.log(`  ❌ <2 líneas ${c422b}/${n422b}`);}
  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{ await teardown().catch(e=>console.error('teardown',e.message)); await db.end(); }
process.exit(fail?1:0);
