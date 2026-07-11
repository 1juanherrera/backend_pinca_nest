import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
const CI4='http://127.0.0.1:8080',NEST='http://127.0.0.1:3009',S=process.env.TOKEN_SECRET;
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const n=Math.floor(Date.now()/1000);const h=b(JSON.stringify({alg:'HS256',typ:'JWT'})),d=b(JSON.stringify({iat:n,exp:n+3600,data:{id:2,username:'root',nombre:'root',rol:'admin',modulos:[],token_version:1}}));
const T=h+'.'+d+'.'+b(crypto.createHmac('sha256',S).update(h+'.'+d).digest());
const db=await mysql.createConnection({host:'127.0.0.1',port:13306,user:'user',password:'password',database:'gestorpincadb'});
const q=async(s,p=[])=>(await db.query(s,p))[0];
const api=async(base,method,path,body)=>{const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+T,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return{status:r.status,body:j};};
let pass=0,fail=0;
function eqS(a,bb){if(a===bb)return true;if(a==null&&bb==null)return true;if(a==null||bb==null)return false;if(String(a)===String(bb))return true;const x=Number(a),y=Number(bb);return !isNaN(x)&&!isNaN(y)&&x===y;}
function diff(a,bb,p=''){const d=[];if(p.endsWith('.fecha_calculo')||p.endsWith('.fecha_update')||p.endsWith('.periodo'))return d;if(Array.isArray(a)||Array.isArray(bb)){if(!Array.isArray(a)||!Array.isArray(bb))return[`${p}:arr`];if(a.length!==bb.length)d.push(`${p}:len ${a.length} vs ${bb.length}`);for(let i=0;i<Math.min(a.length,bb.length);i++)d.push(...diff(a[i],bb[i],`${p}[${i}]`));return d;}if(a&&typeof a==='object'&&bb&&typeof bb==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(bb)])){if(!(k in a)){d.push(`${p}.${k}:soloNest`);continue;}if(!(k in bb)){d.push(`${p}.${k}:soloCI4`);continue;}d.push(...diff(a[k],bb[k],`${p}.${k}`));}return d;}if(!eqS(a,bb))d.push(`${p}: ${JSON.stringify(a)} != ${JSON.stringify(bb)}`);return d;}
function check(name,c,ne){const dd=diff(c.body,ne.body);if(!dd.length&&c.status===ne.status){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name+(c.status!==ne.status?` st ${c.status}/${ne.status}`:''));dd.slice(0,6).forEach(x=>console.log('     '+x));}}
function checkObj(name,c,ne){const dd=diff(c,ne);if(!dd.length){pass++;console.log(`  ✅ ${name}`);}else{fail++;console.log('  ❌ '+name);dd.slice(0,8).forEach(x=>console.log('     '+x));}}
function expect(name,cond,got){if(cond){pass++;console.log('  ✅ '+name);}else{fail++;console.log('  ❌ '+name+' → '+JSON.stringify(got));}}

async function delItem(iid){ await q('DELETE igf FROM item_general_formulaciones igf JOIN formulaciones f ON f.id_formulaciones=igf.formulaciones_id WHERE f.item_general_id=?',[iid]); await q('DELETE FROM formulaciones WHERE item_general_id=?',[iid]); await q('DELETE FROM inventario WHERE item_general_id=?',[iid]); await q('DELETE FROM costos_item WHERE item_general_id=?',[iid]); await q('DELETE FROM item_general WHERE id_item_general=?',[iid]); }
async function delByName(name){ const rows=await q('SELECT id_item_general FROM item_general WHERE nombre=?',[name]); for(const r of rows) await delItem(r.id_item_general); }

try{
  const MP=(await q("SELECT id_item_general FROM item_general WHERE tipo=1 AND deleted_at IS NULL LIMIT 1"))[0].id_item_general;
  await delByName('ZZ_ITEM_TEST'); await delByName('ZZ_ITEM_UPD');
  console.log('');

  // ── LECTURAS ──
  check('GET item_general (list)', await api(CI4,'GET','/api/item_general'), await api(NEST,'GET','/api/item_general'));
  check('GET items (getItemsAll)', await api(CI4,'GET','/api/items'), await api(NEST,'GET','/api/items'));
  check('GET items/materias_disponibles', await api(CI4,'GET','/api/items/materias_disponibles'), await api(NEST,'GET','/api/items/materias_disponibles'));
  check('GET item_general/1 (show)', await api(CI4,'GET','/api/item_general/1'), await api(NEST,'GET','/api/item_general/1'));
  check('GET item_general/1/inventario', await api(CI4,'GET','/api/item_general/1/inventario'), await api(NEST,'GET','/api/item_general/1/inventario'));
  check('GET item_general/buscar?q=pint', await api(CI4,'GET','/api/item_general/buscar?q=pint'), await api(NEST,'GET','/api/item_general/buscar?q=pint'));
  check('GET item_general/buscar?q=pintira (fuzzy soundex)', await api(CI4,'GET','/api/item_general/buscar?q=pintira'), await api(NEST,'GET','/api/item_general/buscar?q=pintira'));
  check('GET item_general/999999 (404)', await api(CI4,'GET','/api/item_general/999999'), await api(NEST,'GET','/api/item_general/999999'));

  // ── CREATE full-item ──
  const createOp=async(base)=>{
    const payload={nombre:'ZZ_ITEM_TEST',codigo:'ZZIT',tipo:'MATERIA PRIMA',costo_unitario:500,volumen:2,envase:10,formulaciones:[{materia_prima_id:MP,cantidad:5,porcentaje:100}],descripcion_formula:'df'};
    const r=await api(base,'POST','/api/item_general',payload);
    const iid=r.body?.id;
    const ig=iid?(await q('SELECT nombre,codigo,tipo,costo_produccion,p_kg FROM item_general WHERE id_item_general=?',[iid]))[0]:null;
    const ci=iid?(await q('SELECT costo_unitario,volumen,envase,metodo_calculo,estado FROM costos_item WHERE item_general_id=?',[iid]))[0]:null;
    const inv=iid?(await q('SELECT cantidad,bodegas_id,tipo FROM inventario WHERE item_general_id=?',[iid]))[0]:null;
    const det=iid?(await q('SELECT igf.item_general_id,igf.cantidad,igf.porcentaje FROM item_general_formulaciones igf JOIN formulaciones f ON f.id_formulaciones=igf.formulaciones_id WHERE f.item_general_id=?',[iid])):[];
    if(iid)await delItem(iid);
    return {status:r.status,msg:r.body?.message,ig,ci:ci?{...ci,costo_unitario:Number(ci.costo_unitario),volumen:Number(ci.volumen),envase:Number(ci.envase)}:null,inv,det:det.map(x=>({item:Number(x.item_general_id),cantidad:Number(x.cantidad),pct:Number(x.porcentaje)}))};
  };
  checkObj('POST create full-item (item+costos+inventario+detalle)', await createOp(CI4), await createOp(NEST));
  check('POST create sin nombre (422)', await api(CI4,'POST','/api/item_general',{codigo:'x'}), await api(NEST,'POST','/api/item_general',{codigo:'x'}));

  // ── UPDATE precio-manual ──
  const pmOp=async(base)=>{
    const iid=(await q("INSERT INTO item_general (nombre,tipo,p_kg) VALUES ('ZZ_ITEM_UPD',1,'')")).insertId;
    const r=await api(base,'PATCH',`/api/item_general/${iid}/precio-manual`,{precio_venta_manual:9999,precio_manual_activo:1});
    const row=(await q('SELECT precio_venta_manual,precio_manual_activo FROM item_general WHERE id_item_general=?',[iid]))[0];
    await delItem(iid);
    return {status:r.status,success:r.body?.success,mensaje:r.body?.mensaje?.replace(String(iid),'{id}'),dbPvm:Number(row.precio_venta_manual),dbAct:Number(row.precio_manual_activo)};
  };
  checkObj('PATCH precio-manual', await pmOp(CI4), await pmOp(NEST));

  // ── UPDATE full-item ──
  const updOp=async(base)=>{
    const iid=(await q("INSERT INTO item_general (nombre,tipo,p_kg) VALUES ('ZZ_ITEM_UPD',0,'')")).insertId;
    await q("INSERT INTO costos_item (item_general_id,costo_unitario,costo_cunete,costo_tambor,volumen,estado) VALUES (?,1,0,0,1,1)",[iid]);
    const r=await api(base,'PUT',`/api/item_general/${iid}`,{nombre:'ZZ_ITEM_UPD',codigo:'UPD',tipo:'INSUMO',costo_unitario:777,volumen:3,formulaciones:[{materia_prima_id:MP,cantidad:2,porcentaje:50}]});
    const ig=(await q('SELECT tipo FROM item_general WHERE id_item_general=?',[iid]))[0];
    const ci=(await q('SELECT costo_unitario,volumen FROM costos_item WHERE item_general_id=?',[iid]))[0];
    const det=(await q('SELECT igf.item_general_id,igf.cantidad FROM item_general_formulaciones igf JOIN formulaciones f ON f.id_formulaciones=igf.formulaciones_id WHERE f.item_general_id=?',[iid]));
    await delItem(iid);
    return {status:r.status,msg:r.body?.message?.replace(String(iid),'{id}'),tipo:Number(ig.tipo),cu:Number(ci.costo_unitario),vol:Number(ci.volumen),det:det.map(x=>({item:Number(x.item_general_id),c:Number(x.cantidad)}))};
  };
  checkObj('PUT update full-item', await updOp(CI4), await updOp(NEST));

  // ── DELETE ── NOTA: CI4 delete() está MUERTO (query WHERE deleted_at sobre formulaciones,
  // tabla que no tiene esa columna → 500 SIEMPRE). Nest lo implementa correctamente.
  console.log('  (CI4 delete MUERTO: formulaciones no tiene deleted_at → 500; verificamos Nest-correcto)');
  const ci4Del=await api(CI4,'DELETE','/api/item_general/999999');
  // el 404 (find null) ocurre ANTES de la query rota → CI4 sí responde 404 para inexistente
  check('DELETE inexistente (404, antes del bug)', ci4Del, await api(NEST,'DELETE','/api/item_general/999999'));
  // Nest sin deps → borra (200 {mensaje}); CI4 tiraría 500
  const iidND=(await q("INSERT INTO item_general (nombre,tipo,p_kg) VALUES ('ZZ_ITEM_DEL',2,'')")).insertId;
  const rND=await api(NEST,'DELETE',`/api/item_general/${iidND}`);
  const goneND=Number((await q('SELECT COUNT(*) n FROM item_general WHERE id_item_general=?',[iidND]))[0].n);
  if(goneND>0)await delItem(iidND);
  expect('Nest delete sin deps → 200 {mensaje}, borrado', rND.status===200 && rND.body?.mensaje===`Item ${iidND} eliminado` && goneND===0, {st:rND.status,body:rND.body,gone:goneND});
  const ci4ND=await api(CI4,'DELETE','/api/item_general/1'); expect('CI4 delete MUERTO (500, doc)', ci4ND.status===500, {st:ci4ND.status});
  // Nest con dep → 409
  const iidDep=(await q("INSERT INTO item_general (nombre,tipo,p_kg) VALUES ('ZZ_ITEM_DEP',1,'')")).insertId;
  const fid=(await q("SELECT id_formulaciones FROM formulaciones LIMIT 1"))[0].id_formulaciones;
  await q("INSERT INTO item_general_formulaciones (formulaciones_id,item_general_id,cantidad) VALUES (?,?,5)",[fid,iidDep]);
  const rDep=await api(NEST,'DELETE',`/api/item_general/${iidDep}`);
  await q("DELETE FROM item_general_formulaciones WHERE item_general_id=?",[iidDep]); await delItem(iidDep);
  expect('Nest delete con dep → 409', rDep.status===409 && /ingrediente/.test(rDep.body?.msg||''), {st:rDep.status,body:rDep.body});

  console.log(`\n═══ RESULTADO: ${pass} OK, ${fail} FALLOS ═══\n`);
}finally{ await delByName('ZZ_ITEM_TEST').catch(()=>{}); await delByName('ZZ_ITEM_UPD').catch(()=>{}); await delByName('ZZ_ITEM_DEL').catch(()=>{}); await db.end(); }
process.exit(fail?1:0);
